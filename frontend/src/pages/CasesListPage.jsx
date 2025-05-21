import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CasesListPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main cases page
    navigate('/cases');
  }, [navigate]);

  return null;
};

export default CasesListPage; 