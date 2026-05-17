import { useState, useEffect } from "react";
import "./LoginForm.css";
import { usersViewModel } from "../../viewmodels/UserViewModel";
import maquinaImg from "../../assets/Maquina.png";
import logoImg from "../../assets/Geova_logo.svg";
import Obligatorio from "../../utils/ui/span-obligatorio";
import DemoWelcomeModal from "../../demo/DemoWelcomeModal";

interface FormState {
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}

interface ErrorState {
  [key: string]: string | null;
}

interface TouchedState {
  [key: string]: boolean;
}

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const [form, setForm] = useState<FormState>({
    username: "",
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitted, setSubmitted] = useState(false);

  // Mostrar modal de demo al cargar la pagina (solo la primera vez)
  useEffect(() => {
    const hasSeenDemoModal = sessionStorage.getItem('hasSeenDemoModal');
    if (!hasSeenDemoModal) {
      setShowDemoModal(true);
      sessionStorage.setItem('hasSeenDemoModal', 'true');
    }
  }, []);

  const toggleMode = () => {
    const nextIsLogin = !isLogin;

    const fieldsForNext = nextIsLogin
      ? ["email", "password"]
      : ["username", "nombre", "apellidos", "email", "password"];

    setErrors((prev) => {
      const newErrors: ErrorState = {};
      fieldsForNext.forEach((f) => {
        if (prev[f]) newErrors[f] = prev[f];
      });
      return newErrors;
    });

    setTouched((prev) => {
      const newTouched: TouchedState = {};
      fieldsForNext.forEach((f) => {
        if (prev[f]) newTouched[f] = prev[f];
      });
      return newTouched;
    });

    setIsLogin(nextIsLogin);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, form[name as keyof FormState]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const validateField = (name: string, value: string) => {
    let error: string | null = null;

    if (!value.trim()) {
      error = "Este campo es obligatorio";
    }

    if (name === "email" && !isLogin && value) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) error = "Ingresa un correo valido";
    }

    if (name === "password" && value) {
      if (isLogin) {
        error = null;
        if (!value.trim()) error = "Este campo es obligatorio";
      } else {
        if (value.length < 8)
          error = "Debe tener al menos 8 caracteres";
        else if (!/[A-Z]/.test(value))
          error = "Debe incluir una letra mayuscula";
        else if (!/[0-9]/.test(value)) error = "Debe incluir un numero";
        else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value))
          error = "Debe incluir un caracter especial";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateAllFields = () => {
    const fields = isLogin
      ? ["email", "password"]
      : ["username", "nombre", "apellidos", "email", "password"];
    const newErrors: ErrorState = {};
    fields.forEach((field) => {
      const err = validateField(field, form[field as keyof FormState]);
      if (err) newErrors[field] = err;
    });
    return newErrors;
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    const newErrors = validateAllFields();
    if (Object.values(newErrors).length > 0) {
      return;
    }
    const result = await usersViewModel.validateLoginOrRegister(form, isLogin);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, ...result.errors }));
      return;
    }
    if (isLogin) {
      await usersViewModel.handleLogin(form.email, form.password);
    } else {
      const registerResult = await usersViewModel.handleRegister(
        form.username,
        form.nombre,
        form.apellidos,
        form.email,
        form.password
      );
      // Si el registro fue exitoso, cambiar al modo login
      if (registerResult.success) {
        setForm({ username: "", nombre: "", apellidos: "", email: "", password: "" });
        setErrors({});
        setTouched({});
        setSubmitted(false);
        setIsLogin(true);
      }
    }
  };

  const showError = (field: keyof FormState) =>
    (touched[field] || submitted) && errors[field];

  return (
    <div className="Login">
      {/* Demo Mode Banner */}
      <div className="demo-banner">
        <i className="bx bx-info-circle"></i>
        <span>Modo Demostracion - Ingresa cualquier correo y contrasena para explorar</span>
        <button className="demo-info-btn" onClick={() => setShowDemoModal(true)}>
          Mas info
        </button>
      </div>

      <div className={`LoginContainer ${!isLogin ? "register-machine" : ""}`}>
        <div className={`Machine ${isLogin ? "" : "register-machine"}`}>
          <img src={maquinaImg} alt="Maquina" />
        </div>
        <div className={`FormContainer ${isLogin ? "login-mode" : "register-mode"}`}>
          <div className="Formtitle">
            <img src={logoImg} alt="Logo" className="logo" />
            <h1>{isLogin ? "Login" : "Registro"}</h1>
          </div>
          <div className="Form">
            {!isLogin && (
              <>
                <div className="inputform">
                  <div className="input-elements">
                    <label>Username</label>
                    <Obligatorio show={!!showError("username")} message={errors.username || ""} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ingresa tu nombre de usuario"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="inputform">
                  <div className="input-elements">
                    <label>Nombre</label>
                    <Obligatorio show={!!showError("nombre")} message={errors.nombre || ""} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ingresa tu nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="inputform">
                  <div className="input-elements">
                    <label>Apellidos</label>
                    <Obligatorio show={!!showError("apellidos")} message={errors.apellidos || ""} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ingresa tus apellidos"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              </>
            )}
            <div className="inputform">
              <div className="input-elements">
                <label>Email</label>
                <Obligatorio show={!!showError("email")} message={errors.email || ""} />
              </div>
              <input
                type="text"
                placeholder="Ingresa tu correo electronico"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div className="inputform">
              <div className="input-elements">
                <label>Contrasena</label>
                <Obligatorio show={!!showError("password")} message={errors.password || ""} />
              </div>
              <input
                type="password"
                placeholder="Ingresa tu contrasena"
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div className="buttonform">
              <button className="loginbutton" onClick={handleSubmit}>
                {isLogin ? "Iniciar sesion" : "Registrarse"}
              </button>
              <p>
                {isLogin ? "No tienes una cuenta? " : "Ya tienes una cuenta? "}
                <span
                  onClick={toggleMode}
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                >
                  {isLogin ? "Registrate" : "Inicia sesion"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Welcome Modal */}
      <DemoWelcomeModal 
        show={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />
    </div>
  );
}

export default Login;
