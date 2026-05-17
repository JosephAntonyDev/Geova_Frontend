import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
  showDeleteConfirmAlert,
  showLoadingAlert,
  closeLoadingAlert,
} from "../utils/alerts";

// Demo mode flag - set to true for demo deployment
const IS_DEMO_MODE = true;

const defaultDemoUser = {
  id: 1,
  Id: 1,
  Username: 'demo_user',
  Nombre: 'Usuario',
  Apellidos: 'Demo',
  Email: 'demo@geova.app',
};

// Helper para obtener usuario demo de localStorage
const getDemoUserFromStorage = () => {
  const stored = localStorage.getItem('demo_user_data');
  if (stored) {
    return JSON.parse(stored);
  }
  return defaultDemoUser;
};

// Helper para guardar usuario demo en localStorage
const saveDemoUserToStorage = (user) => {
  localStorage.setItem('demo_user_data', JSON.stringify(user));
};

export const usersViewModel = {
  async handleRegister(username, nombre, apellidos, email, password) {
    if (IS_DEMO_MODE) {
      showLoadingAlert();
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      closeLoadingAlert();
      
      await showSuccessAlert("Tu cuenta ha sido creada correctamente. (Modo Demo)");
      return { success: true, data: { message: "Registro simulado en modo demo" } };
    }

    // Original implementation for non-demo mode
    try {
      const user = { username, nombre, apellidos, email, password };
      showLoadingAlert();
      const response = await userService.register(user);
      closeLoadingAlert();
      await showSuccessAlert("Tu cuenta ha sido creada correctamente.");
      return { success: true, data: response };
    } catch (error) {
      closeLoadingAlert();
      const backendMsg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      await showErrorAlert(backendMsg);
      return { success: false, error: backendMsg };
    }
  },

  async handleLogin(email, password) {
    if (IS_DEMO_MODE) {
      showLoadingAlert();
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));
      closeLoadingAlert();

      // En modo demo, cualquier credencial funciona
      const demoUser = getDemoUserFromStorage();
      
      // Guardar token demo
      localStorage.setItem("token", "demo_token_" + Date.now());
      
      // Guardar usuario demo
      const userKey = `loggeduser:${demoUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(demoUser));

      await showSuccessAlert(`Bienvenid@, ${demoUser.Nombre || "Usuario Demo"}`);
      
      window.location.href = "#/menu";
      
      return { success: true, data: { user: demoUser, token: "demo_token" } };
    }

    // Original implementation
    try {
      showLoadingAlert();
      const response = await userService.login(email, password);
      closeLoadingAlert();
      localStorage.setItem("token", response.token);
      if (response.user?.id) {
        const userKey = `loggeduser:${response.user.id}`;
        localStorage.setItem(userKey, JSON.stringify(response.user));
      }
      await showSuccessAlert(`Bienvenid@, ${response.user?.nombre || "usuario"}`);
      window.location.href = "#/menu";
      return { success: true, data: response };
    } catch (error) {
      closeLoadingAlert();
      const backendMsg =
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error?.message ||
        "Error inesperado";
      await showErrorAlert(backendMsg);
      return { success: false, error: backendMsg };
    }
  },

  async handleGetLoggedUser() {
    if (IS_DEMO_MODE) {
      const key = Object.keys(localStorage).find((k) =>
        k.startsWith("loggeduser:")
      );
      
      if (!key) {
        // Si no hay usuario logueado, retornar el demo user por defecto
        return { success: true, data: getDemoUserFromStorage() };
      }

      const storedUser = JSON.parse(localStorage.getItem(key));
      return { success: true, data: storedUser };
    }

    // Original implementation
    try {
      const key = Object.keys(localStorage).find((k) =>
        k.startsWith("loggeduser:")
      );
      if (!key)
        return {
          success: false,
          error: "Usuario no encontrado en localStorage",
        };

      const userId = key.split(":")[1];
      const response = await userService.getUserById(userId);
      return { success: true, data: response };
    } catch (error) {
      const msg = error.response?.data?.details || error.message;
      return { success: false, error: msg };
    }
  },

  async handleUpdateUser(id, updatedUser) {
    if (IS_DEMO_MODE) {
      // Actualizar usuario en localStorage
      const currentUser = getDemoUserFromStorage();
      const updated = {
        ...currentUser,
        Username: updatedUser.Username || updatedUser.username || currentUser.Username,
        Nombre: updatedUser.Nombre || updatedUser.nombre || currentUser.Nombre,
        Apellidos: updatedUser.Apellidos || updatedUser.apellidos || currentUser.Apellidos,
        Email: updatedUser.Email || updatedUser.email || currentUser.Email,
      };
      
      saveDemoUserToStorage(updated);
      
      // También actualizar en loggeduser
      const userKey = `loggeduser:${currentUser.id}`;
      localStorage.setItem(userKey, JSON.stringify(updated));
      
      return { success: true, data: updated };
    }

    // Original implementation
    try {
      const mappedUser = {
        username: updatedUser.Username || updatedUser.username || '',
        nombre: updatedUser.Nombre || updatedUser.nombre || '',
        apellidos: updatedUser.Apellidos || updatedUser.apellidos || '',
        email: updatedUser.Email || updatedUser.email || '',
      };
      
      if (updatedUser.password) {
        mappedUser.password = updatedUser.password;
      }
      
      const response = await userService.updateUser(id, mappedUser);
      return { success: true, data: response };
    } catch (error) {
      const msg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      return { success: false, error: msg };
    }
  },

  showSuccessAlert,
  showErrorAlert,

  async handleUpdateUserWithAlert(id, updatedUser, setUser, setEditMode) {
    const result = await usersViewModel.handleUpdateUser(id, updatedUser);

    if (result.success) {
      await showSuccessAlert("Tu perfil se ha actualizado correctamente.");
      setUser(updatedUser);
      setEditMode(false);
    } else {
      await showErrorAlert(result.error);
    }
  },

  async handleDeleteUser(id) {
    if (IS_DEMO_MODE) {
      // En modo demo, simular eliminacion
      return { success: true, data: { message: "Usuario eliminado (modo demo)" } };
    }

    // Original implementation
    try {
      const response = await userService.deleteUser(id);
      return { success: true, data: response };
    } catch (error) {
      const msg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      return { success: false, error: msg };
    }
  },

  async handleDeleteUserWithAlert(id) {
    if (IS_DEMO_MODE) {
      const confirm = await showDeleteConfirmAlert(
        "En modo demo, esta accion simulara la eliminacion de tu cuenta."
      );

      if (confirm.isConfirmed) {
        await showSuccessAlert("Cuenta eliminada. (Modo Demo)");
        // Limpiar datos y redirigir
        localStorage.removeItem('demo_user_data');
        localStorage.clear();
        window.location.href = "#/";
      }
      return;
    }

    // Original implementation
    const confirm = await showDeleteConfirmAlert(
      "Esta accion eliminara tu cuenta permanentemente."
    );

    if (confirm.isConfirmed) {
      const response = await usersViewModel.handleDeleteUser(id);

      if (response.success) {
        await showSuccessAlert("Tu cuenta ha sido eliminada.");
        localStorage.clear();
        window.location.href = "/login";
      } else {
        await showErrorAlert(response.error);
      }
    }
  },

  async validateLoginOrRegister(form, isLogin) {
    let errors = {};
    let ok = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;

    if (isLogin) {
      // En modo demo, solo validar que los campos no esten vacios
      if (IS_DEMO_MODE) {
        if (!form.email.trim()) {
          errors.email = "Ingresa cualquier correo para acceder a la demo.";
          ok = false;
        }
        if (!form.password.trim()) {
          errors.password = "Ingresa cualquier contrasena para acceder a la demo.";
          ok = false;
        }
        return { ok, errors };
      }

      if (!form.email.trim()) {
        errors.email = "Este campo es obligatorio.";
        ok = false;
      } else if (!emailRegex.test(form.email)) {
        errors.email = "Formato de correo invalido.";
        ok = false;
      }

      if (!form.password.trim()) {
        errors.password = "Este campo es obligatorio.";
        ok = false;
      }

      return { ok, errors };
    }

    // Validaciones de registro (mantener las mismas)
    if (!form.email.trim()) {
      errors.email = "Este campo es obligatorio.";
      ok = false;
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Formato de correo invalido.";
      ok = false;
    }

    if (!form.password.trim()) {
      errors.password = "Este campo es obligatorio.";
      ok = false;
    } else if (form.password.length < 8) {
      errors.password = "Debe tener al menos 8 caracteres.";
      ok = false;
    } else if (!/[A-Z]/.test(form.password)) {
      errors.password = "Debe incluir al menos una mayuscula.";
      ok = false;
    } else if (!/[0-9]/.test(form.password)) {
      errors.password = "Debe incluir al menos un numero.";
      ok = false;
    } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(form.password)) {
      errors.password = "Debe incluir un caracter especial.";
      ok = false;
    }

    if (!form.username.trim()) {
      errors.username = "Este campo es obligatorio.";
      ok = false;
    } else if (!usernameRegex.test(form.username)) {
      errors.username = "Minimo 3 caracteres (solo letras, numeros o _).";
      ok = false;
    }

    if (!form.nombre.trim()) {
      errors.nombre = "Este campo es obligatorio.";
      ok = false;
    } else if (!nameRegex.test(form.nombre)) {
      errors.nombre = "Solo letras, minimo 2 caracteres.";
      ok = false;
    }
    if (!form.apellidos.trim()) {
      errors.apellidos = "Este campo es obligatorio.";
      ok = false;
    } else if (!nameRegex.test(form.apellidos)) {
      errors.apellidos = "Solo letras, minimo 2 caracteres.";
      ok = false;
    }
    return { ok, errors };
  },
};
