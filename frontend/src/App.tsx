import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import AuthCallback from "./pages/AuthPages/AuthCallback";
import AuthPending from "./pages/AuthPages/AuthPending";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/auth/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SACADDashboard from "./pages/SACAD/SACADDashboard";
import FacultadesPage from "./pages/SACAD/FacultadesPage";
import SedesPage from "./pages/SACAD/SedesPage";
import CarrerasPage from "./pages/SACAD/CarrerasPage";
import PlanesPage from "./pages/SACAD/PlanesPage";
import AreasPage from "./pages/SACAD/AreasPage";
import MateriasPage from "./pages/SACAD/MateriasPage";
import EquivalenciasPage from "./pages/SACAD/EquivalenciasPage";
import DocentesPage from "./pages/SACAD/DocentesPage";
import ProfilePage from "./pages/SACAD/ProfilePage";
import ConfiguracionPage from "./pages/SACAD/ConfiguracionPage";
import AutorizacionUsuariosPage from "./pages/SACAD/AutorizacionUsuariosPage";
import GestionDominiosPage from "./pages/SACAD/GestionDominiosPage";
import GestionRolesPage from "./pages/SACAD/GestionRolesPage";
import GestionTiposMateriaPage from "./pages/SACAD/GestionTiposMateriaPage";
import GestionDesignacionesPage from "./pages/SACAD/GestionDesignacionesPage";
import SearchPage from "./pages/SACAD/SearchPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<SACADDashboard />} />
              <Route path="/facultades" element={<FacultadesPage />} />
              <Route path="/sedes" element={<SedesPage />} />
              <Route path="/carreras" element={<CarrerasPage />} />
              <Route path="/planes" element={<PlanesPage />} />
              <Route path="/areas" element={<AreasPage />} />
              <Route path="/materias" element={<MateriasPage />} />
              <Route path="/equivalencias" element={<EquivalenciasPage />} />
              <Route path="/docentes" element={<DocentesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
              <Route path="/configuracion/usuarios" element={<AutorizacionUsuariosPage />} />
              <Route path="/configuracion/dominios" element={<GestionDominiosPage />} />
              <Route path="/configuracion/roles" element={<GestionRolesPage />} />
              <Route path="/configuracion/tipos-materia" element={<GestionTiposMateriaPage />} />
              <Route path="/configuracion/cargos_dedicaciones" element={<GestionDesignacionesPage />} />
              <Route path="/buscar" element={<SearchPage />} />
            </Route>
          </Route>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/pending" element={<AuthPending />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
