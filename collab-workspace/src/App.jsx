import React from 'react';
import RealTimeEditor from './components/RealTimeEditor';

function App() {
  // Real-world e eta URL parameter ba state theke ashte pare
  // Testing-er jonno amra ekta fixed Room ID use korchi
  const DEFAULT_ROOM_ID = "high-voltage-room-101";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Collaborative Workspace
        </h1>
        <p className="text-gray-600 mt-2">
          Real-time sync enabled. Edit and see changes instantly!
        </p>
      </header>

      <main className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
        {/* Editor Component-e Room ID pass kora hochhe */}
        <RealTimeEditor roomId={DEFAULT_ROOM_ID} />
      </main>

      <footer className="mt-10 text-gray-400 text-sm">
        Built with React + Socket.io + Tailwind CSS
      </footer>
    </div>
  );
}

export default App;