
import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { adminApp } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required." }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth(adminApp).createSessionCookie(idToken, { expiresIn });
    
    const options = {
      name: "__session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    const res = NextResponse.json({ status: "success" }, { status: 200 });
    res.cookies.set(options);
    
    return res;

  } catch (error: any) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
