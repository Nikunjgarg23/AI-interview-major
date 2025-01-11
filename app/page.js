"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

export default function Home() {
  const router = useRouter();
  useEffect(()=>{
    router.replace('/dashboard');
  },[router]);
  return (
  <div className="text-center">
    <h1>Please Wait!!</h1>
  </div>
  );
}
