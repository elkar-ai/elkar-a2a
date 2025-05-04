#!/usr/bin/env node
/**
 * This script helps set up the environment variables for Supabase authentication.
 * Run with: node setup-env.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🚀 Supabase Auth Setup Helper\n");
console.log(
  "This script will help you create a .env.local file with your Supabase credentials.\n"
);

// Function to validate URL format
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "https:" && url.host.includes("supabase.co");
  } catch (_) {
    return false;
  }
}

// Function to validate Anon Key format (basic check)
function isValidAnonKey(key) {
  return key && key.length > 20 && key.startsWith("eyJ");
}

// Prompt for Supabase URL
rl.question(
  "Enter your Supabase URL (from Project Settings > API): ",
  (url) => {
    if (!isValidUrl(url)) {
      console.log(
        "\n❌ Warning: This doesn't look like a valid Supabase URL. It should be in the format: https://xxxxxxxxxxxx.supabase.co\n"
      );

      rl.question(
        "Do you still want to continue with this URL? (y/n): ",
        (answer) => {
          if (answer.toLowerCase() !== "y") {
            console.log(
              "\n🛑 Setup aborted. Please try again with a valid Supabase URL."
            );
            rl.close();
            return;
          }
          promptForKey(url);
        }
      );
    } else {
      promptForKey(url);
    }
  }
);

function promptForKey(url) {
  rl.question(
    "Enter your Supabase Anon Key (from Project Settings > API): ",
    (key) => {
      if (!isValidAnonKey(key)) {
        console.log(
          '\n❌ Warning: This doesn\'t look like a valid Supabase Anon Key. It should be a long string starting with "eyJ".\n'
        );

        rl.question(
          "Do you still want to continue with this key? (y/n): ",
          (answer) => {
            if (answer.toLowerCase() !== "y") {
              console.log(
                "\n🛑 Setup aborted. Please try again with a valid Supabase Anon Key."
              );
              rl.close();
              return;
            }
            createEnvFile(url, key);
          }
        );
      } else {
        createEnvFile(url, key);
      }
    }
  );
}

function createEnvFile(url, key) {
  const envContent = `VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${key}`;

  try {
    fs.writeFileSync(path.join(__dirname, ".env.local"), envContent);
    console.log("\n✅ Success! .env.local file created.");
    console.log(
      "\n⚠️  IMPORTANT: If your development server is running, you need to restart it for the changes to take effect."
    );
    console.log(
      "\n🔍 To test your Supabase connection, visit: http://localhost:5173/supabase-test"
    );
  } catch (error) {
    console.error("\n❌ Error creating .env.local file:", error.message);
  }

  // Supabase setup reminder
  console.log("\n📋 Remember to:");
  console.log("  1. Set up Google OAuth in your Google Cloud Console");
  console.log(
    "  2. Configure the Google provider in Supabase Authentication settings"
  );
  console.log(
    "  3. Add the following redirect URL to both Google and Supabase:"
  );
  console.log(`     http://localhost:5173/auth/callback\n`);

  rl.close();
}

rl.on("close", () => {
  console.log("\n👋 Thank you for using the setup helper!");
  process.exit(0);
});
