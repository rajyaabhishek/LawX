import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { selectedCaseAtom } from '../atoms/casesAtom';

const CaseDetailPage = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const setSelectedCase = useSetRecoilState(selectedCaseAtom);

  useEffect(() => {
    // Set the selected case ID if available
    if (caseId) {
      setSelectedCase(caseId);
    }
    
    // Redirect to the main cases page
    navigate('/cases');
  }, [navigate, caseId, setSelectedCase]);

  return null;
};

export default CaseDetailPage; 