import {
  HeartIcon,
  CodeBracketIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-gray-800 bg-black">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-gray-400">Built with</span>
          <HeartIcon className="w-4 h-4 text-red-500" />
          <span className="text-gray-400">by</span>
          <a
            href="https://github.com/ridhorezkyanwar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-green-400 font-semibold transition-colors"
          >
            Ridho Rezky Anwar
          </a>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          AWS Certified Machine Learning Engineer | Cybersecurity Enthusiast
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm">
          <a
            href="https://github.com/ridhorezkyanwar/security-headers-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <CodeBracketIcon className="w-4 h-4" />
            Source Code
          </a>
          <a
            href="mailto:ridhorezkyanwar122@gmail.com"
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <EnvelopeIcon className="w-4 h-4" />
            Contact
          </a>
          <a
            href="https://linkedin.com/in/ridho-rezky-anwar-98bb3a370"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            LinkedIn
          </a>
        </div>
        
        <p className="text-xs text-gray-600 mt-6">
          © {new Date().getFullYear()} Security Headers Analyzer. Open source under MIT License.
        </p>
      </div>
    </footer>
  );
}