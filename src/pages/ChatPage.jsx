import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  MessageSimple,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import { VideoIcon, ArrowLeftIcon, CreditCardIcon } from "lucide-react";

import "stream-chat-react/dist/css/v2/index.css";

// Import PaymentButton and PaymentMessage
import PaymentButton from "../components/PaymentButton";
import PaymentMessage from "../components/PaymentMessage";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        const members = Object.values(currChannel.state.members);
        const targetMember = members.find(member => member.user.id !== authUser._id);
        if (targetMember) {
          setTargetUser(targetMember.user);
        }

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `🎥 I've started a video call. Join me here: ${callUrl}`,
      });

      window.open(callUrl, '_blank');
      toast.success("Video call started!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <div className="chat-header">
        {/* Left side - User info */}
        <div className="header-left">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeftIcon className="size-5 text-gray-600" />
          </Link>
          {targetUser && (
            <div className="flex items-center gap-3">
              <div className="avatar size-10">
                <img 
                  src={targetUser.image || targetUser.profilePic} 
                  alt={targetUser.name || targetUser.fullName}
                  className="rounded-full" 
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{targetUser.name || targetUser.fullName}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span className="size-2 rounded-full bg-green-500 inline-block" />
                  2 members, 1 online
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Video call button */}
        <div className="header-right">
          <button 
            onClick={handleVideoCall} 
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            title="Start Video Call"
          >
            <VideoIcon className="size-4" />
            Start Call
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <Chat client={chatClient} theme="str-chat__theme-light">
        <Channel channel={channel}>
          <Window>
            <MessageList
              Message={(props) => {
                if (props.message?.type === 'payment') {
                  return <PaymentMessage message={props.message} />;
                }
                return <MessageSimple {...props} />;
              }}
            />

            {/* Message Input + Payment Button */}
            <div className="bg-white border-t border-gray-200 px-3 py-3">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <MessageInput />
                </div>
                <PaymentButton
                  onSuccess={(paymentDetails) => {
                    channel.sendMessage({
                      text: `💸 Payment sent: ₹${paymentDetails.amount}`,
                      type: 'payment',
                      payment_details: {
                        type: "sent",
                        ...paymentDetails,
                        transaction_id: paymentDetails.razorpay_payment_id
                      },
                    });
                    toast.success(`₹${paymentDetails.amount} sent successfully!`);
                  }}
                  disabled={!channel}
                  defaultRecipientName={targetUser?.name || targetUser?.fullName}
                />
              </div>
            </div>
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
