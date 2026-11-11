import { useLocation, useNavigate, useParams } from 'react-router-dom';

const withRouter = (Component) => {
  function ComponentWithRouter(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    return <Component {...props} params={params} navigate={navigate} location={location} />;
  }

  return ComponentWithRouter;
};

export default withRouter;
