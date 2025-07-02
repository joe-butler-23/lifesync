
import { useCallback, useContext, createContext } from 'react';
import ClaudeService from '../services/ClaudeService';

const ClaudeContext = createContext();

export const useClaudeIntegration = () => {
  const context = useContext(ClaudeContext);
  if (!context) {
    throw new Error('useClaudeIntegration must be used within ClaudeProvider');
  }
  return context;
};

export const ClaudeProvider = ({ children, appState, appActions }) => {
  const askClaude = useCallback(async (query, componentContext = null) => {
    try {
      // Prepare comprehensive app context
      const fullContext = {
        currentView: appState.activeView,
        selectedDate: appState.selectedDate,
        tasks: appState.tasks,
        scheduledRecipes: appState.scheduledRecipes,
        scheduledWorkouts: appState.scheduledWorkouts,
        scratchpadContent: appState.scratchpadContent,
        filters: {
          dayTaskFilter: appState.dayTaskFilter,
          activeFilters: Array.from(appState.activeFilters || []),
          taskFilter: appState.taskFilter
        },
        integrations: {
          todoistConnected: !!appState.todoistToken,
          googleCalendarConnected: !!appState.googleCalendarToken
        },
        componentContext
      };

      const response = await ClaudeService.analyzeAppState(fullContext, query);
      
      // Execute actions returned by Claude
      if (response.actions) {
        for (const action of response.actions) {
          await executeAction(action, appActions);
        }
      }

      return response;
    } catch (error) {
      console.error('Claude integration error:', error);
      return {
        response: "I'm sorry, I encountered an error. Please try again.",
        actions: [],
        insights: []
      };
    }
  }, [appState, appActions]);

  const getContextualHelp = useCallback(async (component, componentState, query) => {
    try {
      return await ClaudeService.getContextualHelp(component, componentState, query);
    } catch (error) {
      console.error('Contextual help error:', error);
      return {
        response: "I'm sorry, I couldn't provide help at this time.",
        actions: []
      };
    }
  }, []);

  const value = {
    askClaude,
    getContextualHelp
  };

  return (
    <ClaudeContext.Provider value={value}>
      {children}
    </ClaudeContext.Provider>
  );
};

// Action executor
const executeAction = async (action, appActions) => {
  const { type, payload } = action;

  switch (type) {
    case 'NAVIGATE':
      appActions.setActiveView(payload.view);
      break;
    
    case 'SET_DATE':
      appActions.setSelectedDate(new Date(payload.date));
      break;
    
    case 'ADD_TASK':
      await appActions.handleAddTask(payload);
      break;
    
    case 'UPDATE_TASK':
      await appActions.handleEditTask(payload.taskId, payload.updates);
      break;
    
    case 'SCHEDULE_RECIPE':
      appActions.setScheduledRecipes(prev => ({
        ...prev,
        [payload.date]: {
          ...prev[payload.date],
          [payload.mealType]: [
            ...(prev[payload.date]?.[payload.mealType] || []),
            payload.recipeId
          ]
        }
      }));
      break;
    
    case 'SCHEDULE_WORKOUT':
      appActions.setScheduledWorkouts(prev => ({
        ...prev,
        [payload.date]: [
          ...(prev[payload.date] || []),
          payload.workoutId
        ]
      }));
      break;
    
    case 'UPDATE_SCRATCHPAD':
      appActions.setScratchpadContent(payload.content);
      const dateKey = payload.date || new Date().toLocaleDateString('en-CA');
      localStorage.setItem(`scratchpad-${dateKey}`, payload.content);
      break;
    
    case 'APPLY_FILTER':
      if (payload.filterType === 'tasks') {
        appActions.setActiveFilters(new Set([payload.filter]));
      } else if (payload.filterType === 'day') {
        appActions.setDayTaskFilter(payload.filter);
      }
      break;
    
    default:
      console.warn('Unknown action type:', type);
  }
};
