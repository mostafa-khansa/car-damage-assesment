import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import AssessmentModel from "@/models/Assessment";

export async function GET() {
    try {
        await connectToDatabase();
        const items = await AssessmentModel.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(items, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch assessments" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();

        const {
            _id,
            title,
            beforeImageUrl,
            afterImageUrl,
            totalCost,
            damages,
            createdAt,
        } = body ?? {};

        if (!title || !beforeImageUrl || !afterImageUrl || totalCost == null) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const doc = await AssessmentModel.create({
            _id,
            title,
            beforeImageUrl,
            afterImageUrl,
            totalCost,
            damages,
            createdAt,
        });

        return NextResponse.json(doc, { status: 201 });
    } catch (err: unknown) {

        if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
            return NextResponse.json(
                { error: "A document with this _id already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Failed to save assessment" },
            { status: 500 }
        );
    }
}
