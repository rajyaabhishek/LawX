import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateCasePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the cases page and automatically scroll to the case creation form
    navigate('/cases');
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, [navigate]);

  return null;
};

export default CreateCasePage; 