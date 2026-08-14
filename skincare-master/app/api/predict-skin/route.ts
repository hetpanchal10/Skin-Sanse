import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return Response.json({ error: "Image file is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const tmpImagePath = path.join(
      os.tmpdir(),
      `skin-upload-${Date.now()}-${image.name || "image.jpg"}`
    );
    await fs.writeFile(tmpImagePath, buffer);

    const projectRoot = process.cwd();
    const pythonPath = path.join(projectRoot, "ml", ".venv_torch", "Scripts", "python.exe");
    const scriptPath = path.join(projectRoot, "ml", "predict_skin.py");
    const modelPath = path.join(projectRoot, "ml", "skin_type_efficientnetb0.pt");

    const { stdout, stderr } = await execFileAsync(pythonPath, [
      scriptPath,
      "--image",
      tmpImagePath,
      "--model",
      modelPath,
    ]);

    await fs.unlink(tmpImagePath).catch(() => {});

    if (stderr && stderr.trim()) {
      return Response.json({ error: stderr }, { status: 500 });
    }

    const parsed = JSON.parse(stdout);
    return Response.json(parsed, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Prediction failed.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
