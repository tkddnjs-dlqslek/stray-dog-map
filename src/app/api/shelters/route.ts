import { NextResponse } from "next/server";
import { getShelters } from "@/lib/store";

export function GET() {
  return NextResponse.json(getShelters());
}
