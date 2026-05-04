import { createContext, useContext } from 'react';

const VoiceActionsContext = createContext(null);

export const usePageActions = () => {
  const context = useContext(VoiceActionsContext);
  if (!context) {
    return {};
  }
  return context;
};

export const VoiceActionsProvider = ({ children, actions = {} }) => {
  return (
    <VoiceActionsContext.Provider value={actions}>
      {children}
    </VoiceActionsContext.Provider>
  );
};

export default VoiceActionsContext;
