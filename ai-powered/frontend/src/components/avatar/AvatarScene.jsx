import InterviewerPhoto from './InterviewerPhoto';

export default function AvatarScene({ gender, isSpeaking, isListening, emotion }) {
  return (
    <div className="w-full h-full">
      <InterviewerPhoto
        gender={gender}
        isSpeaking={isSpeaking}
        isListening={isListening}
        emotion={emotion}
      />
    </div>
  );
}
