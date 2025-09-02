
import { NextResponse } from "next/server";

export async function POST() {
  const options = {
    name: "__session",
    value: "",
    maxAge: -1,
  };

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(options);

  return response;
}
