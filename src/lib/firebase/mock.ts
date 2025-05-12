// Mock implementations for development
export const setupMockFirestore = () => {
  // Mock data store for development
  const mockData: Record<string, Record<string, any>> = {
    users: {
      'mock-user-1': {
        id: 'mock-user-1',
        ign: 'TestPlayer123',
        email: 'test@example.com',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        isPremium: false,
      }
    },
    tournaments: {},
    tournament_drafts: {}
  };
  
  // Mock document reference
  class MockDocumentReference {
    constructor(public path: string, public id: string) {}
  }
  
  // Return mock Firestore operations
  return {
    collection: (collectionPath: string) => {
      // Create the collection if it doesn't exist
      if (!mockData[collectionPath]) {
        mockData[collectionPath] = {};
      }
      
      return {
        // Mock document
        doc: (docId: string) => {
          const docRef = new MockDocumentReference(collectionPath, docId);
          
          return {
            id: docId,
            get: async () => {
              const data = mockData[collectionPath][docId];
              return {
                exists: () => !!data,
                data: () => data,
                id: docId
              };
            },
            set: async (data: any) => {
              mockData[collectionPath][docId] = {
                ...data,
                id: docId
              };
              return docRef;
            },
            update: async (data: any) => {
              mockData[collectionPath][docId] = {
                ...mockData[collectionPath][docId],
                ...data
              };
              return docRef;
            }
          };
        },
        // Add document with auto-generated ID
        add: async (data: any) => {
          const docId = 'mock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
          mockData[collectionPath][docId] = {
            ...data,
            id: docId,
            created_at: new Date().toISOString()
          };
          return new MockDocumentReference(collectionPath, docId);
        },
        // Query operations
        where: () => ({
          get: async () => ({
            docs: Object.entries(mockData[collectionPath]).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true
            }))
          })
        }),
        orderBy: () => ({
          get: async () => ({
            docs: Object.entries(mockData[collectionPath]).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true
            }))
          })
        })
      };
    }
  };
};

// Mock Auth implementation
export const setupMockAuth = () => {
  return {
    currentUser: {
      uid: 'mock-user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      // Simulate a logged-in user
      setTimeout(() => {
        callback({
          uid: 'mock-user-1',
          email: 'test@example.com',
          displayName: 'Test User'
        });
      }, 100);
      return () => {}; // Unsubscribe function
    }
  };
};

// Mock Storage implementation
export const setupMockStorage = () => {
  return {
    ref: (path: string) => ({
      put: async (file: File) => {
        console.log('Mock file upload:', file.name, 'to path:', path);
        return {
          ref: {
            getDownloadURL: async () => `https://placehold.co/600x400?text=${encodeURIComponent(file.name)}`
          }
        };
      }
    }),
    refFromURL: (url: string) => ({
      delete: async () => {
        console.log('Mock file deletion:', url);
        return Promise.resolve();
      }
    })
  };
}; 