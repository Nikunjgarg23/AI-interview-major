"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

import * as faceapi from 'face-api.js';


const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) => {
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    let intervalId;

    const handleVideoPlay = () => {
      const video = videoRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };

      faceapi.matchDimensions(canvasRef.current, displaySize);

      intervalId = setInterval(async () => {
        if (video.videoWidth && video.videoHeight) {
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks().withFaceExpressions();

          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
        }
      }, 100);
    };

    if (isPlaying) {
      videoRef.current.addEventListener("play", handleVideoPlay);
    }

    return () => {
      clearInterval(intervalId);
      videoRef.current?.removeEventListener("play", handleVideoPlay);
    };
  }, [isPlaying]);


  useEffect(() => {
    results.map((result) =>
      setUserAnswer((prevAns) => prevAns + result?.transcript)
    );
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      UpdateUserAnswer();
    }
  }, [userAnswer]);

  const StartStopRecording = async () => {
    if (canvasRef.current) {
      console.log("cleared");
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (isRecording) {
      stopSpeechToText();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsPlaying(false);
      // if (userAnswer?.length < 10) {
      //   setLoading(false)
      //   toast("Error while saving your answer,please record again");
      // }
      if (canvasRef.current) {
        console.log("cleared");
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsPlaying(true);
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    console.log(userAnswer, "########");
    setLoading(true);
    const feedbackPrompt =
      "Question:" +
      mockInterviewQuestion[activeQuestionIndex]?.question +
      ", User Answer:" +
      userAnswer +
      ",Depends on question and user answer for given interview question " +
      " please give use rating for answer and feedback as area of improvement if any" +
      " in just 3 to 5 lines to improve it in JSON format with rating field and feedback field";
    console.log(
      "🚀 ~ file: RecordAnswerSection.jsx:38 ~ SaveUserAnswer ~ feedbackPrompt:",
      feedbackPrompt
    );
    // const result = await chatSession.sendMessage(feedbackPrompt);
    const result = await chatSession.sendMessage(feedbackPrompt, { topK: 40 });

    console.log(
      "🚀 ~ file: RecordAnswerSection.jsx:46 ~ SaveUserAnswer ~ result:",
      result
    );
    const mockJsonResp = (await result.response.text())
      .replace("```json", "")
      .replace("```", "")
      .trim();

    console.log(
      "🚀 ~ file: RecordAnswerSection.jsx:47 ~ SaveUserAnswer ~ mockJsonResp:",
      mockJsonResp
    );
    const JsonfeedbackResp = JSON.parse(mockJsonResp);
    const resp = await db.insert(UserAnswer).values({
      mockIdRef: interviewData?.mockId,
      question: mockInterviewQuestion[activeQuestionIndex]?.question,
      correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
      userAns: userAnswer,
      feedback: JsonfeedbackResp?.feedback,
      rating: JsonfeedbackResp?.rating,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      createdAt: moment().format("DD-MM-YYYY"),
    });

    if (resp) {
      toast("User Answer recorded successfully");
      setUserAnswer("");
      setResults([]);
    }
    setResults([]);
    setLoading(false);
  };

  if (error) return <p>Web Speech API is not available in this browser 🤷‍</p>;
  return (
    <div className="flex justify-center items-center flex-col">
      <>
        <div style={{ position: "relative", width: "440px", height: "390px" }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "440px", height: "390px", position: "absolute" }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", top: 0, left: 0, width: "440px", height: "390px" }}
          />
        </div>
      </>
      <div className="mt-4">
        <Button
          disabled={!modelsLoaded}
          variant="outline"
          className="my-10"
          // onClick={startVideo}
          onClick={StartStopRecording}
        >
          {isRecording ? (
            <h2 className="text-red-600 items-center animate-pulse flex gap-2">
              <StopCircle /> Stop Recording...
            </h2>
          ) : (
            <h2 className="text-primary flex gap-2 items-center">
              <Mic /> Record Answer
            </h2>
          )}
        </Button>
      </div>
      {/* <Button onClick={() => console.log("------", userAnswer)}>
        Show User Answer
      </Button> */}
    </div>
  );
};

export default RecordAnswerSection;