import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import inquirer from "inquirer";
import { User } from "../models/user.model.js";
import { connectDatabase } from "../config/database.js";

// Utility functions
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// CLI Actions
async function addUser() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter user email:",
      validate: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return "Please enter a valid email address";
        }
        return true;
      }
    },
    {
      type: "input",
      name: "name",
      message: "Enter user name:",
      validate: (input) => input.length >= 2
    },
    {
      type: "password",
      name: "password",
      message: "Enter password:",
      validate: (input) => {
        if (input.length < 8) {
          return "Password must be at least 8 characters long";
        }
        return true;
      }
    }
  ]);

  try {
    const existingUser = await User.findOne({ email: answers.email });
    if (existingUser) {
      console.log("User already exists with this email");
      return;
    }

    const hashedPassword = await hashPassword(answers.password);
    const user = new User({
      email: answers.email,
      name: answers.name,
      password: hashedPassword
    });

    await user.save();
    console.log("User created successfully!");
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

async function updatePassword() {
  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter user email:"
    }
  ]);

  const user = await User.findOne({ email });
  if (!user) {
    console.log("User not found");
    return;
  }

  const { newPassword } = await inquirer.prompt([
    {
      type: "password",
      name: "newPassword",
      message: "Enter new password:",
      validate: (input) => input.length >= 8
    }
  ]);

  try {
    const hashedPassword = await hashPassword(newPassword);
    await User.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          lastPasswordUpdate: new Date()
        }
      }
    );
    console.log("Password updated successfully!");
  } catch (error) {
    console.error("Error updating password:", error);
  }
}

async function listUsers() {
  const users = await User.find({}, { password: 0 });
  console.log("\nRegistered Users:");
  users.forEach((user) => {
    console.log(`\nEmail: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Created: ${user.createdAt}`);
    console.log(`Last Password Update: ${user.lastPasswordUpdate}`);
  });
}

async function deleteUser() {
  const { email } = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter user email to delete:"
    }
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you sure you want to delete this user?",
      default: false
    }
  ]);

  if (!confirm) {
    console.log("Operation cancelled");
    return;
  }

  try {
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) {
      console.log("User not found");
    } else {
      console.log("User deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

// Main CLI interface
async function main() {
  await connectDatabase();

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: ["Add User", "Update Password", "List Users", "Delete User", "Exit"]
      }
    ]);

    switch (action) {
      case "Add User":
        await addUser();
        break;
      case "Update Password":
        await updatePassword();
        break;
      case "List Users":
        await listUsers();
        break;
      case "Delete User":
        await deleteUser();
        break;
      case "Exit":
        console.log("Goodbye!");
        process.exit(0);
    }

    console.log("\n-------------------\n");
  }
}

// Start the CLI
main().catch(console.error);
