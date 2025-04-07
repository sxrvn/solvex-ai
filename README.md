# Doubt Solver AI

An AI-powered application that helps solve doubts and questions, with support for both text and image inputs. Built with React, TypeScript, and integrated with the Gemini API.

## Features

- Text and image-based question answering
- LaTeX support for mathematical equations
- Modern, responsive UI
- Real-time answers with loading states
- Error handling and retry mechanism
- Beautiful typography with Computer Modern font

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- KaTeX for LaTeX rendering
- React Markdown
- React Dropzone
- Lucide React Icons

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd doubt-solver
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API key:
```env
VITE_ROUTER_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Environment Variables

The following environment variables are required:

- `VITE_ROUTER_API_KEY`: Your API key for the AI service

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy your application.

Make sure to add the required environment variables in your Vercel project settings.

## License

MIT

## Author

[Your Name] 