import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";
import { db } from "@/utils/db"; // Assuming db operations are allowed here
import { eq } from "drizzle-orm";
import { MockInterview } from "@/utils/schema";
const InterviewItemCard = ({ interview, refreshInterviewList }) => {
  const router = useRouter();

  const onStart = () => {
    router.push('/dashboard/interview/' + interview?.mockId);
  };

  const onFeedbackPress = () => {
    router.push('dashboard/interview/' + interview.mockId + "/feedback");
  };

  const handeldelete = async () => {
    try {
      const result = await db.delete(MockInterview)
        .where(eq(MockInterview.mockId, interview.mockId));
      // console.log(`Interview ${interview.mockId} deleted successfully`, result);
      refreshInterviewList();
    } catch (error) {
      console.error("Error deleting interview:", error);
    }
  };

  return (
    <div className="border shadow-sm rounded-sm p-3">
      <h2 className="font-bold text-primary">{interview?.jobPosition}</h2>
      <h2 className="text-sm text-gray-500">{interview?.jobExperience} Year Of Experience</h2>
      <h2 className="text-xs text-gray-400">Created At: {interview?.createdAt}</h2>
      <div className="flex justify-between gap-5 mt-2">
        <Button size="sm" variant="outline" className="w-full" onClick={onFeedbackPress}>
          Feedback
        </Button>
        <Button className="w-full" size="sm" onClick={onStart}>
          Start
        </Button>
        <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded" onClick={handeldelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default InterviewItemCard;
