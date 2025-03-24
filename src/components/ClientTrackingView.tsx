// Remover esta linha de importação
// import { ClientTrackingView } from './components/ClientTrackingView';

// Manter o componente ClientTrackingView como já definido dentro do App.tsx
const ClientTrackingView = () => {
  const project = projects.find(p => p.id === trackingProjectId);
  
  // Resto do código do componente...
};

// Adicionar o useEffect para detectar a URL de acompanhamento
useEffect(() => {
  const path = window.location.pathname;
  const match = path.match(/\/acompanhamento\/([^\/]+)/);
  
  if (match && match[1]) {
    setTrackingProjectId(match[1]);
    setShowClientTracking(true);
  }
}, []);

// No return final, garantir que o ClientTrackingView seja exibido quando showClientTracking for true
return (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    {showClientTracking ? (
      <ClientTrackingView />
    ) : (
      // Resto do código do layout normal do aplicativo
    )}
  </div>
);