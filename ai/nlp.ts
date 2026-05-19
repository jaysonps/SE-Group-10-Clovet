import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export const analyzeProductCategory = async (name: string, description: string): Promise<string[]> => {
  const pythonPath = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");
  const scriptPath = path.join(process.cwd(), "ai", "classifier.py");
  
  // Escape arguments for shell execution
  const escapedName = name.replace(/"/g, '\\"');
  const escapedDescription = description.replace(/"/g, '\\"');
  
  try {
    const { stdout, stderr } = await execPromise(`${pythonPath} "${scriptPath}" "${escapedName}" "${escapedDescription}"`);
    
    if (stderr && !stdout) {
      console.error("Python execution error:", stderr);
      throw new Error(`Python error: ${stderr}`);
    }
    
    try {
      const categories = JSON.parse(stdout.trim());
      if (!Array.isArray(categories)) {
        throw new Error("Invalid output format from Python script");
      }
      return categories;
    } catch (parseError) {
      console.error("Failed to parse Python output:", stdout);
      throw new Error("Failed to parse AI classification result");
    }
  } catch (error) {
    console.error("Failed to execute Python NLP script:", error);
    // Fallback to a basic classification if python fails (for dev resilience)
    return ["Tops"];
  }
};
