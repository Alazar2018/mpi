import { useState } from "react";
import { inviteService } from "@/service/invite.server";
import { useAuthStore } from "@/store/auth.store";
import icons from "@/utils/icons";

// Confetti component for success celebration
const Confetti = () => {
  const confettiPieces = [
    { id: 1, color: '#FF6B6B', shape: 'circle', x: 10, y: 20, size: 8, delay: 0 },
    { id: 2, color: '#4ECDC4', shape: 'square', x: 85, y: 15, size: 6, delay: 0.2 },
    { id: 3, color: '#45B7D1', shape: 'triangle', x: 25, y: 60, size: 10, delay: 0.4 },
    { id: 4, color: '#96CEB4', shape: 'star', x: 70, y: 45, size: 12, delay: 0.6 },
    { id: 5, color: '#FFEAA7', shape: 'hexagon', x: 15, y: 80, size: 7, delay: 0.8 },
    { id: 6, color: '#DDA0DD', shape: 'rectangle', x: 80, y: 75, size: 9, delay: 1.0 },
    { id: 7, color: '#FFB347', shape: 'circle', x: 45, y: 25, size: 6, delay: 1.2 },
    { id: 8, color: '#87CEEB', shape: 'square', x: 60, y: 55, size: 8, delay: 1.4 },
    { id: 9, color: '#98FB98', shape: 'triangle', x: 30, y: 70, size: 9, delay: 1.6 },
    { id: 10, color: '#F0E68C', shape: 'star', x: 75, y: 30, size: 11, delay: 1.8 },
    { id: 11, color: '#E6E6FA', shape: 'hexagon', x: 20, y: 40, size: 7, delay: 2.0 },
    { id: 12, color: '#FFA07A', shape: 'rectangle', x: 65, y: 85, size: 8, delay: 2.2 },
    { id: 13, color: '#20B2AA', shape: 'circle', x: 40, y: 90, size: 6, delay: 2.4 },
    { id: 14, color: '#FF69B4', shape: 'square', x: 90, y: 60, size: 9, delay: 2.6 },
    { id: 15, color: '#32CD32', shape: 'triangle', x: 10, y: 50, size: 10, delay: 2.8 },
    { id: 16, color: '#FFD700', shape: 'star', x: 55, y: 15, size: 12, delay: 3.0 },
    { id: 17, color: '#9370DB', shape: 'hexagon', x: 85, y: 90, size: 7, delay: 3.2 },
    { id: 18, color: '#FFA07A', shape: 'rectangle', x: 25, y: 85, size: 8, delay: 3.4 },
    { id: 19, color: '#00CED1', shape: 'circle', x: 70, y: 10, size: 6, delay: 3.6 },
    { id: 20, color: '#FF8C00', shape: 'square', x: 15, y: 30, size: 9, delay: 3.8 }
  ];

  const renderShape = (piece: any) => {
    const style = {
      position: 'absolute' as const,
      left: `${piece.x}%`,
      top: `${piece.y}%`,
      width: `${piece.size}px`,
      height: `${piece.size}px`,
      backgroundColor: piece.color,
      animation: `confetti-fall 3s ease-in-out ${piece.delay}s infinite`,
      transform: 'rotate(0deg)',
      zIndex: 10
    };

    switch (piece.shape) {
      case 'circle':
        return <div style={{ ...style, borderRadius: '50%' }} />;
      case 'square':
        return <div style={style} />;
      case 'triangle':
        return (
          <div style={{
            ...style,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderLeft: `${piece.size/2}px solid transparent`,
            borderRight: `${piece.size/2}px solid transparent`,
            borderBottom: `${piece.size}px solid ${piece.color}`
          }} />
        );
      case 'star':
        return (
          <div style={{
            ...style,
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }} />
        );
      case 'hexagon':
        return (
          <div style={{
            ...style,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }} />
        );
      case 'rectangle':
        return <div style={{ ...style, borderRadius: '2px' }} />;
      default:
        return <div style={style} />;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
      {confettiPieces.map(piece => renderShape(piece))}
    </>
  );
};

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const [email, setEmail] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(10);
  
  const authStore = useAuthStore();
  const currentUserRole = authStore.getRole();

  // Get available relationships based on current user's role
  const getAvailableRelationships = () => {
    return inviteService.getAvailableRelationships(currentUserRole || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
         if (!email.trim() || !selectedRelationship) {
       setError("Please fill in all fields");
       return;
     }

    setIsLoading(true);

         try {
       // Validate relationship type
              if (!inviteService.isValidRelationship(currentUserRole || '', selectedRelationship)) {
         setError("Invalid relationship type for your role");
         return;
       }

       // Send invitation directly
       await inviteService.sendInvite({
         email: email.trim(),
         relationship: selectedRelationship as 'parent' | 'coach' | 'child' | 'player' | 'join'
       });
       
              setSuccess("Connection invite sent successfully!");
       setEmail("");
       setSelectedRelationship("");
       
       // Start countdown and close modal after 10 seconds
       setCountdown(10);
       const countdownInterval = setInterval(() => {
         setCountdown(prev => {
           if (prev <= 1) {
             clearInterval(countdownInterval);
             onClose();
             return 0;
           }
           return prev - 1;
         });
       }, 1000);
      
    } catch (error: any) {
             setError(error.message || "Failed to send connection invite");
    } finally {
      setIsLoading(false);
    }
  };

     const handleClose = () => {
     if (!isLoading) {
       setEmail("");
       setSelectedRelationship("");
       setError("");
       setSuccess("");
       setCountdown(10);
       onClose();
     }
   };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent backdrop-blur-sm"
        onClick={handleClose}
      />
      
             {/* Modal */}
       <div className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full mx-4 p-6 transition-all duration-500 ${
         success ? 'max-w-2xl scale-110' : 'max-w-md scale-100'
       }`}>
        {/* Header */}
        <div className={`flex items-center justify-between mb-6 transition-all duration-500 ${
          success ? 'bg-gradient-to-r from-green-400 to-emerald-500 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-2xl' : ''
        }`}>
          <h2 className={`text-xl font-semibold transition-colors duration-500 ${
            success ? 'text-white' : 'text-gray-900'
          }`}>
            {success ? '🎉 Invitation Sent!' : 'Send Connection Invite'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-all duration-500 disabled:opacity-50 ${
              success 
                ? 'hover:bg-white/20 text-white' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <i
              className="*:size-5"
              dangerouslySetInnerHTML={{ __html: icons.close }}
            />
          </button>
        </div>

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01443B] focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          {/* Role Selection */}
          <div>
                         <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
               Connection Type
             </label>
                         <select
               id="relationship"
               value={selectedRelationship}
               onChange={(e) => setSelectedRelationship(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01443B] focus:border-transparent"
               disabled={isLoading}
               required
             >
                             <option value="">Select connection type</option>
                             {getAvailableRelationships().map((relationship) => (
                 <option key={relationship.value} value={relationship.value}>
                   {relationship.label}
                 </option>
               ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

                                {/* Success Message */}
            {success && (
              <div className="relative overflow-hidden min-h-[400px] flex items-center justify-center">
                {/* Confetti overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <Confetti />
                </div>
                
                {/* Success content */}
                <div className="relative z-10 bg-gradient-to-r from-green-400 to-emerald-500 p-8 rounded-xl border-2 border-green-300 shadow-lg w-full">
                  <div className="text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    {/* Success Text */}
                    <h3 className="text-2xl font-bold text-white mb-3">🎉 Invitation Sent!</h3>
                    <p className="text-base text-green-100 mb-6">{success}</p>
                    
                    {/* Celebration Emojis */}
                    <div className="flex justify-center space-x-3 mb-6">
                      <span className="text-3xl animate-bounce" style={{ animationDelay: '0s' }}>🎊</span>
                      <span className="text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>✨</span>
                      <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎈</span>
                      <span className="text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</span>
                    </div>
                    
                    {/* Countdown and Close Button */}
                    <div className="space-y-3">
                      <p className="text-sm text-green-100">
                        Closing automatically in <span className="font-bold text-white">{countdown}</span> seconds
                      </p>
                      <button
                        onClick={onClose}
                        className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors shadow-lg"
                      >
                        Close Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#01443B] text-white py-2 px-4 rounded-lg hover:bg-[#01352E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Request...
              </div>
            ) : (
              "Send Connection Invite"
            )}
                     </button>
         </form>
        )}

                                 {/* Info Text */}
         {!success && (
           <div className="mt-4 p-3 border rounded-lg bg-blue-50 border-blue-200">
             <p className="text-xs text-blue-600">
               Based on your role as <span className="font-medium capitalize">{currentUserRole}</span>, 
               you can send connection invites to: {getAvailableRelationships().map(r => r.label).join(" and ")}
             </p>
           </div>
         )}
      </div>
    </div>
  );
}
