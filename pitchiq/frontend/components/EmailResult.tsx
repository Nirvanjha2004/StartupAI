"""Email result display component"""
import React, { useState } from 'react';

interface EmailResultProps {
  subject?: string;
  body?: string;
  sentiment?: string;
  onCopy?: (text: string) => void;
  onEdit?: (text: string) => void;
}

export default function EmailResult({
  subject = "Subject line here",
  body = "Email body would appear here...",
  sentiment = "positive",
  onCopy,
  onEdit
}: EmailResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    if (onCopy) {
      onCopy(fullEmail);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Sentiment badge */}
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSentimentColor(sentiment)}`}>
          Sentiment: {sentiment}
        </span>
        <div className="space-x-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(body)}
              className="px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded-lg text-sm font-medium transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Email preview */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <div className="mb-4">
          <p className="text-sm text-gray-600 font-semibold">Subject</p>
          <p className="text-lg font-semibold text-gray-900">{subject}</p>
        </div>

        <hr className="my-4" />

        <div>
          <p className="text-sm text-gray-600 font-semibold mb-2">Body</p>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}
