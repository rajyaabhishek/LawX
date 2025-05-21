import { render, screen } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { MemoryRouter } from "react-router-dom"; // If any NavLink/Link used internally
import { ChakraProvider } from "@chakra-ui/react"; // Or your custom theme provider
import Message from "./Message";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { formatMessageTimestamp } from "../utils/dateUtils"; // Import the actual or a mock

// Mock dateUtils if needed, or use the actual implementation
vi.mock("../utils/dateUtils", () => ({
  formatMessageTimestamp: vi.fn((date) => new Date(date).toLocaleTimeString()),
}));

// Mock Atoms
const mockUser = {
  _id: "user123",
  username: "senderUser",
  profilePic: "sender.jpg",
};

const mockSelectedConversation = {
  _id: "conv456",
  userId: "receiver123",
  username: "receiverUser",
  userProfilePic: "receiver.jpg",
};

describe("Message Component", () => {
  const baseMessageProps = {
    message: {
      _id: "msg1",
      text: "Hello there!",
      createdAt: new Date().toISOString(),
      sender: "user123", // Corresponds to mockUser._id for ownMessage
    },
  };

  const renderWithMessage = (props, ownMessage = true) => {
    const messageProps = {
      ...baseMessageProps,
      ...props,
      ownMessage,
    };
    return render(
      <RecoilRoot
        initializeState={({ set }) => {
          set(userAtom, mockUser);
          set(selectedConversationAtom, mockSelectedConversation);
        }}
      >
        <ChakraProvider>
          <MemoryRouter>
            <Message {...messageProps} />
          </MemoryRouter>
        </ChakraProvider>
      </RecoilRoot>
    );
  };

  test("renders sender's message correctly", () => {
    renderWithMessage({});
    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(formatMessageTimestamp).toHaveBeenCalledWith(baseMessageProps.message.createdAt);
    expect(screen.getByText(new Date(baseMessageProps.message.createdAt).toLocaleTimeString())).toBeInTheDocument();

    const avatarImg = screen.getByRole('img', { name: '' }); // Chakra Avatar might not have a name
    expect(avatarImg).toHaveAttribute("src", mockUser.profilePic);
    
    // Check for alignment (hard to check alignSelf directly, but can check parent flex)
    // This is a bit indirect. Ideally, a data-testid could be used on the Flex.
    const messageTextElement = screen.getByText("Hello there!");
    // The direct parent of text is a Flex, then the bubble Flex, then the outer Flex with alignSelf
    const bubbleFlex = messageTextElement.parentElement.parentElement; 
    expect(bubbleFlex.parentElement).toHaveStyle("align-self: flex-end");
  });

  test("renders receiver's message correctly", () => {
    const receiverMessage = {
      ...baseMessageProps.message,
      sender: "receiver123", // Different sender
    };
    renderWithMessage({ message: receiverMessage }, false);

    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(formatMessageTimestamp).toHaveBeenCalledWith(receiverMessage.createdAt);
    expect(screen.getByText(new Date(receiverMessage.createdAt).toLocaleTimeString())).toBeInTheDocument();
    
    const avatarImgs = screen.getAllByRole('img', { name: '' });
    // First avatar is receiver, second is current user (sender of the message in this context)
    // For receiver message, the first avatar is the one from selectedConversation
    expect(avatarImgs[0]).toHaveAttribute("src", mockSelectedConversation.userProfilePic);

    const messageTextElement = screen.getByText("Hello there!");
    const bubbleFlex = messageTextElement.parentElement.parentElement;
    // For receiver messages, the parent Flex does not have alignSelf: flex-end (default is flex-start)
    expect(bubbleFlex.parentElement).not.toHaveStyle("align-self: flex-end");
  });

  test("renders message with image correctly", () => {
    const messageWithImage = {
      ...baseMessageProps.message,
      img: "image.png",
      text: "", // Test image-only message
    };
    renderWithMessage({ message: messageWithImage });

    const imageElement = screen.getByAltText("Message image");
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute("src", "image.png");
    expect(formatMessageTimestamp).toHaveBeenCalledWith(messageWithImage.createdAt);
  });
  
  test("renders message with text and image correctly", () => {
    const messageWithTextAndImage = {
      ...baseMessageProps.message,
      text: "Look at this image!",
      img: "image.png",
    };
    renderWithMessage({ message: messageWithTextAndImage });

    expect(screen.getByText("Look at this image!")).toBeInTheDocument();
    const imageElement = screen.getByAltText("Message image");
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute("src", "image.png");
    expect(formatMessageTimestamp).toHaveBeenCalledWith(messageWithTextAndImage.createdAt);
  });

  // Test for seen status (check icon color) could be added if BsCheck2All is uniquely identifiable
  // Test for message tail is complex for RTL, focus on core content.
});
