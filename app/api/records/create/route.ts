import { NextResponse } from "next/server";
import { createTableSchema } from "../services";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate ID from name (slugify) or random
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || nanoid(8);

    const schema = await createTableSchema(id, name, description);
    return NextResponse.json(schema);
  } catch (error) {
    console.error("Create Table Error:", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

