# HFSE Online Admission Web App

The **HFSE Online Admission Web App** is a modern, user-friendly platform designed for the parents of HFSE International School students to manage student enrollment and re-enrollment. The app simplifies the admission process by allowing parents to submit required documents, update student information, and track application status—all in one place.

## ✨ Features

- 👪 **Parent Portal** – Secure login and signup for parents to manage one or more children.
- 📄 **Student Enrollment** – Submit new student applications with necessary personal and academic details.
- 🔁 **Re-enrollment System** – Reuse and update previously submitted student data for a new school year.
- 🗂 **Document Uploads** – Upload and preview required enrollment documents (e.g. passport, birth certificate, ID photos).
- ✅ **Progress Validation** – Forms with real-time validation and progress-based navigation.
- 🔒 **Supabase Integration** – Secure backend for authentication, storage, and database handling.

## 🛠 Tech Stack

- **Frontend**: React + Vite + TypeScript
- **UI Components**: ShadCN UI + Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Backend**: Supabase (Auth, Database, Storage)

## 📁 Project Structure (simplified)

src/
├───actions
├───assets
├───components
│ ├───auth
│ ├───layout
│ ├───private
│ ├───public
│ └───ui
├───context
├───data
├───hooks
├───lib
├───pages
│ ├───auth
│ ├───private
│ └───public
└───routes
