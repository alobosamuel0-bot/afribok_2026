import AsyncStorage from '@react-native-async-storage/async-storage';
import Database from '../db/database';

export const useOffline = () => {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const subscription = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => {
      subscription();
    };
  }, []);

  const syncOfflineData = async () => {
    if (!isOnline) return;

    try {
      const db = await Database.open();
      const pendingOperations = await db.executeSql(
        'SELECT * FROM pending_operations ORDER BY created_at ASC'
      );

      for (const operation of pendingOperations) {
        // Send operation to server
        // On success, delete from pending_operations
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  return { isOnline, syncOfflineData };
};
