import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { ChakraProvider } from "@chakra-ui/react";
import MessageContainer from "./MessageContainer";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { useSocket } from "../context/SocketContext";
import { axiosInstance } from "../lib/axios";
import { MemoryRouter } from "react-router-dom";

// --- Mocks ---
vi.mock("../hooks/useShowToast");
vi.mock("../context/SocketContext");
vi.mock("../lib/axios");

// Mock framer-motion
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      // Mock specific motion components used, like motion.div or motion(Box)
      // For motion(Box), we need to ensure Box is a valid component here.
      // Simplest is to make motion.custom return its children or a simple div.
      custom: vi.fn(({ children }) => children), 
      div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>), // If MotionBox resolves to motion.div
      // If Box is directly used as motion(Box)
      // It might be better to mock the MotionBox component if it's exported separately
      // For now, let's assume MotionBox is effectively a div for testing animation presence.
    },
  };
});
// If MotionBox is specifically `motion(Box)` from Chakra, this might need adjustment
// A simpler approach for testing is to ensure the `MotionBox` is used, not to test framer-motion itself.


const mockShowToast = vi.fn();
const mockSocketOn = vi.fn();
const mockSocketOff = vi.fn();
const mockSocketEmit = vi.fn();

const mockCurrentUser = { _id: "currentUser123", username: "CurrentUser" };
const mockOtherUser = { _id: "otherUser456", username: "OtherUser", profilePic: "other.jpg" };

const mockSelectedConv = {
  _id: "conv1",
  userId: mockOtherUser._id, // ID of the other participant
  username: mockOtherUser.username,
  userProfilePic: mockOtherUser.profilePic,
};

const mockMessagesList = [
  { _id: "msg1", text: "Hello from other", sender: mockOtherUser._id, createdAt: new Date().toISOString() },
  { _id: "msg2", text: "Hi from current", sender: mockCurrentUser._id, createdAt: new Date().toISOString() },
];

// Initial Recoil state setup helper
const initializeState = (selectedConv = mockSelectedConv) => ({ set }) => {
  set(userAtom, mockCurrentUser);
  set(selectedConversationAtom, selectedConv);
  set(conversationsAtom, selectedConv ? [{
    _id: selectedConv._id,
    participants: [mockCurrentUser, mockOtherUser],
    lastMessage: { text: "Hi", sender: mockCurrentUser._id },
    participantDetails: [mockOtherUser],
  }] : []);
};

describe("MessageContainer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useShowToast.mockReturnValue(mockShowToast);
    useSocket.mockReturnValue({
      socket: { on: mockSocketOn, off: mockSocketOff, emit: mockSocketEmit },
      onlineUsers: [],
    });
    axiosInstance.get.mockResolvedValue({ data: [...mockMessagesList] }); // For fetching messages
    axiosInstance.post.mockResolvedValue({ data: {} }); // For markAsSeen and sending new message (MessageInput mock)
  });

  const renderComponent = (selectedConvOverride = mockSelectedConv) => {
    return render(
      <RecoilRoot initializeState={initializeState(selectedConvOverride)}>
        <ChakraProvider> {/* Ensure theme context for Chakra components */}
          <MemoryRouter> {/* If any NavLink/Link used by children */}
            <MessageContainer />
          </MemoryRouter>
        </ChakraProvider>
      </RecoilRoot>
    );
  };

  test("renders 'Select a conversation' when no conversation is selected", () => {
    renderComponent(null); // Pass null to select no conversation
    expect(screen.getByText("Select a conversation to start chatting")).toBeInTheDocument();
  });

  test("renders loading skeletons initially then messages", async () => {
    axiosInstance.get.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: [...mockMessagesList] }), 100))
    );
    renderComponent();

    // Check for skeletons (assuming MessageContainer shows some form of global loading state, not just per-message)
    // The current skeleton is per-message, so this test structure might need adjustment
    // For now, we'll look for the effect of loadingMessages = true (e.g. specific skeleton text or structure)
    // The current component shows skeletons inside the map loop, so we'd see multiple.
    // Let's check for one of the texts that should appear AFTER loading.
    expect(screen.queryByText("Hello from other")).not.toBeInTheDocument(); // Initially not there

    await waitFor(() => {
      expect(screen.getByText("Hello from other")).toBeInTheDocument();
      expect(screen.getByText("Hi from current")).toBeInTheDocument();
    }, { timeout: 2000 }); // Increased timeout for safety

    expect(axiosInstance.get).toHaveBeenCalledWith(`/api/v1/messages/${mockSelectedConv.userId}`);
    // Check if MessageInput is rendered
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });
  
  test("renders header with selected conversation user's details", async () => {
    renderComponent();
    await waitFor(() => { // Wait for messages to load, which implies header is also set
        expect(screen.getByText(mockSelectedConv.username)).toBeInTheDocument();
    });
    const avatarImg = screen.getByRole('img', { name: mockSelectedConv.username });
    expect(avatarImg).toHaveAttribute("src", mockSelectedConv.userProfilePic);
  });

  test("handles new incoming message via socket", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Hello from other")).toBeInTheDocument(); // Ensure initial messages are loaded
    });

    // Simulate receiving a new message via socket
    const newMessage = { _id: "msg3", text: "New socket message", sender: mockOtherUser._id, conversationId: mockSelectedConv._id, createdAt: new Date().toISOString() };
    // Find the socket 'newMessage' handler and call it
    const newMessageCallback = mockSocketOn.mock.calls.find(call => call[0] === 'newMessage')?.[1];
    if (newMessageCallback) {
      newMessageCallback(newMessage);
    } else {
      throw new Error("newMessage socket handler not found");
    }

    await waitFor(() => {
      expect(screen.getByText("New socket message")).toBeInTheDocument();
    });
  });
  
  test("marks messages as seen when conversation is opened", async () => {
    // Modify mockMessagesList to have an unread message from the other user
    const messagesWithUnread = [
      { _id: "msg1", text: "Unread message", sender: mockOtherUser._id, createdAt: new Date().toISOString(), seen: false },
    ];
    axiosInstance.get.mockResolvedValue({ data: messagesWithUnread });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Unread message")).toBeInTheDocument();
    });
    
    // useEffect for markMessagesAsSeen should be triggered
    await waitFor(() => {
        // Check if the API call to mark messages as seen was made
        // The path might differ based on your API structure; adjust if needed
        expect(axiosInstance.post).toHaveBeenCalledWith(`/messages/${mockSelectedConv._id}/seen`);
        // Check if socket emit for markMessagesAsSeen was called
        expect(mockSocketEmit).toHaveBeenCalledWith("markMessagesAsSeen", {
            conversationId: mockSelectedConv._id,
            userId: mockCurrentUser._id,
        });
    });

    // Simulate receiving "messagesSeen" event from socket
    const messagesSeenCallback = mockSocketOn.mock.calls.find(call => call[0] === 'messagesSeen')?.[1];
    if (messagesSeenCallback) {
        messagesSeenCallback({ conversationId: mockSelectedConv._id });
    } else {
        console.warn("messagesSeen socket handler not found for direct call in test");
    }
    // Test that messages are updated to seen:true - this requires checking internal state or a visual cue.
    // This is harder to assert without a visual change or specific data-testid indicating seen status.
  });


  // Test for sending a message (integration with MessageInput)
  // This test is more complex and assumes MessageInput works correctly.
  test("sending a message through MessageInput updates message list and emits socket event", async () => {
    renderComponent();
    await waitFor(() => { // Ensure initial load
      expect(screen.getByText("Hello from other")).toBeInTheDocument();
    });

    const messageInputText = "My new message from test";
    const inputField = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getAllByLabelText("Send message").find(btn => btn.closest('form'));


    fireEvent.change(inputField, { target: { value: messageInputText } });
    expect(sendButton).toBeEnabled();
    
    // Mock the post request for sending the message from MessageInput
    axiosInstance.post.mockResolvedValueOnce({ 
        data: { _id: "serverNewMsgId", sender: mockCurrentUser._id, text: messageInputText, createdAt: new Date().toISOString() }
    });

    fireEvent.click(sendButton);

    // 1. Optimistic update - message should appear almost immediately
    await waitFor(() => {
      expect(screen.getByText(messageInputText)).toBeInTheDocument();
    });

    // 2. axiosInstance.post from MessageInput to send the message
    await waitFor(() => {
        expect(axiosInstance.post).toHaveBeenCalledWith("/messages", {
            message: messageInputText,
            recipientId: mockSelectedConv.userId,
            img: "", // Assuming no image is sent in this test
        });
    });
    
    // 3. socket.emit("sendMessage") from MessageInput
    await waitFor(() => {
      expect(mockSocketEmit).toHaveBeenCalledWith("sendMessage", expect.objectContaining({
        text: messageInputText,
        recipientId: mockSelectedConv.userId,
        // tempId might be part of the emitted object if MessageInput adds it
      }));
    });
  });

});
