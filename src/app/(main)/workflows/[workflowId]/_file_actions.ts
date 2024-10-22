"use server";

import { createObject } from "@/lib/utils";
import { db } from "@/server/db";
import { taskFiles, tasks, workflows } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { deleteFile, utapi } from "@/server/uploadthing";
import { and, eq } from "drizzle-orm";
import { type UploadFileResult } from "uploadthing/types";
import { array, instanceof as instanceof_, object, string } from "zod";

const fileSchema = array(
  instanceof_(File).refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "Each file must be less than 5MB",
  }),
).optional();

const saveFileInTaskSchema = object({
  taskId: string().min(1),
  files: fileSchema,
});

export async function saveFileInTask(formData: FormData) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const { files, taskId } = saveFileInTaskSchema.parse(createObject(formData));

  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
    .where(and(eq(workflows.userId, session.user.id), eq(tasks.id, taskId)));

  if (!task) throw new Error("Unauthorized");

  let filesUploaded: UploadFileResult[] = [];

  if (files) {
    filesUploaded = await utapi.uploadFiles(files);
  }

  filesUploaded = filesUploaded.filter(({ error }) => error === null);

  const taskFilesCreated = await db
    .insert(taskFiles)
    .values(
      filesUploaded.map(({ data }) => ({
        fileName: data!.name,
        fileKey: data!.key,
        fileUrl: data!.url,
        taskId: taskId,
        fileSize: data!.size,
        fileType: data!.type,
      })),
    )
    .returning();

  return taskFilesCreated;
}

export async function deleteFilesFromTask(fileId: number) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const [taskFile] = await db
    .select({ id: taskFiles.id })
    .from(taskFiles)
    .leftJoin(tasks, eq(tasks.id, taskFiles.taskId))
    .leftJoin(workflows, eq(workflows.id, tasks.workflowId))
    .where(
      and(eq(workflows.userId, session.user.id), eq(taskFiles.id, fileId)),
    );

  if (!taskFile) throw new Error("Unauthorized");

  await deleteFile(taskFile.id);

  return taskFile.id;
}