import React from 'react'
import { useChatStore } from '../store/useChatStore'
import BorderAnimatedContainer from '../components/BorderAnimatedContainer';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import ChatContainer from '../components/ChatContainer';
import ChatList from '../components/ChatList';
import ContactList from '../components/ContactList';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ProfileHeader from '../components/ProfileHeader';

function ChatPage() {
    const { activeTab, selectedUser } = useChatStore();
  return (
    <div className='relative w-full max-w-6xl h-[800px]'>
        <BorderAnimatedContainer>
          {/* Left Side for this actual page! */}
          <div className='w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col'>
            <ProfileHeader />
            <ActiveTabSwitch />

            <div className='flex-1 overflow-auto p-4 space-y-2'>
              {activeTab === "chats" ? <ChatList /> : <ContactList />}
            </div>
          </div>

          {/* Right Side for this entire page! */}
          <div className='flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm'>
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
          </div>
        </BorderAnimatedContainer>
    </div>
  )
}

export default ChatPage