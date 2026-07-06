import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "src", "data", "subscribers.json");

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Ensure directory exists
    const dir = path.dirname(SUBSCRIBERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read current subscribers
    let subscribers: string[] = [];
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      try {
        const fileData = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8");
        subscribers = JSON.parse(fileData);
      } catch (e) {
        subscribers = [];
      }
    }

    // Avoid duplicates
    if (subscribers.includes(email.trim().toLowerCase())) {
      return NextResponse.json(
        { error: "This email is already subscribed!" },
        { status: 400 }
      );
    }

    // Add subscriber
    subscribers.push(email.trim().toLowerCase());
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), "utf-8");

    return NextResponse.json(
      { message: "Successfully subscribed to the newsletter!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process subscription." },
      { status: 500 }
    );
  }
}
