import './Profile.css';
import { useEffect, useState } from 'react';
import { usersViewModel } from '../../viewmodels/UserViewModel';
import { projectService } from '../../services/ProjectService';

// Demo mode flag
const IS_DEMO_MODE = true;

function Profile() {
    const [user, setUser] = useState(null);
    const [totalProjects, setTotalProjects] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [formData, setFormData] = useState({ Nombre: '', Apellidos: '', Email: '', Username: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        usersViewModel.handleGetLoggedUser().then((res) => {
            if (res.success) {
                setUser(res.data);
                setFormData(res.data);
                
                if (IS_DEMO_MODE) {
                    // En modo demo, obtener proyectos del localStorage
                    const storedProjects = localStorage.getItem('demo_projects');
                    if (storedProjects) {
                        const projects = JSON.parse(storedProjects);
                        setTotalProjects(projects.length);
                    }
                } else {
                    // Obtener total de proyectos del servidor
                    projectService.getTotalProjectsByUser(res.data.Id).then((result) => {
                        setTotalProjects(result.total_projects || 0);
                    });
                }
            } else {
                console.error('Error al obtener el usuario:', res.error);
            }
        });
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setPasswordError('');
    };

    const handleSave = () => {
        // Enviar datos sin contraseña (el backend mantiene la actual)
        usersViewModel.handleUpdateUserWithAlert(user.Id, formData, setUser, setEditMode);
    };

    const handleSavePassword = async () => {
        // Validar que las contraseñas coincidan
        if (passwordData.password !== passwordData.confirmPassword) {
            setPasswordError('Las contraseñas no coinciden');
            return;
        }

        // Validar requisitos de contraseña
        const password = passwordData.password;
        if (password.length < 8) {
            setPasswordError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setPasswordError('Debe incluir al menos una mayúscula');
            return;
        }
        if (!/[0-9]/.test(password)) {
            setPasswordError('Debe incluir al menos un número');
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/]/.test(password)) {
            setPasswordError('Debe incluir un carácter especial');
            return;
        }

        // Enviar datos actuales + nueva contraseña
        const dataWithPassword = {
            ...formData,
            password: passwordData.password
        };

        const result = await usersViewModel.handleUpdateUser(user.Id, dataWithPassword);
        if (result.success) {
            await usersViewModel.showSuccessAlert('Contraseña actualizada correctamente');
            setPasswordMode(false);
            setPasswordData({ password: '', confirmPassword: '' });
        } else {
            setPasswordError(result.error);
        }
    };

    const cancelPasswordEdit = () => {
        setPasswordMode(false);
        setPasswordData({ password: '', confirmPassword: '' });
        setPasswordError('');
    };

    const handleDelete = () => {
        usersViewModel.handleDeleteUserWithAlert(user.Id);
    };

    return (
        <div className='ProfileContainer'>
            <div className='ProfileTitleContainer'>
                <div className='ProfileTitle'>
                    <h1>Tu perfil</h1>
                    <i className="bx bxs-user"></i>
                </div>
                <div className='ProfileEndTitle'>
                </div>
            </div>

            <div className='ProfileData'>
                <div className='ProfilePhoto'>
                    <i className='bx bxs-user-circle'></i>
                    {IS_DEMO_MODE && (
                        <div className="demo-badge">Usuario Demo</div>
                    )}
                </div>

                <div className='ProfileInfo'>
                    <h3>Datos de usuario</h3>
                    {user ? (
                        <div className='profdata'>
                            {editMode ? (
                                <div className='profdataedit'>
                                    <input name="Nombre" value={formData.Nombre} onChange={handleInputChange} placeholder="Nombre" />
                                    <input name="Apellidos" value={formData.Apellidos} onChange={handleInputChange} placeholder="Apellidos" />
                                    <input name="Email" value={formData.Email} onChange={handleInputChange} placeholder="Email" />
                                    <div className='editoptions'>
                                        <button onClick={() => setEditMode(false)} className='CancelEditButton'>Cancelar</button>
                                        <button onClick={handleSave} className='GuardarEditButton'>Guardar</button>
                                    </div>
                                </div>
                            ) : passwordMode ? (
                                <div className='profdataedit'>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={passwordData.password} 
                                        onChange={handlePasswordChange} 
                                        placeholder="Nueva contraseña" 
                                    />
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        value={passwordData.confirmPassword} 
                                        onChange={handlePasswordChange} 
                                        placeholder="Confirmar contraseña" 
                                    />
                                    {passwordError && <p className='PasswordError'>{passwordError}</p>}
                                    <p className='PasswordHint'>
                                        Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
                                    </p>
                                    <div className='editoptions'>
                                        <button onClick={cancelPasswordEdit} className='CancelEditButton'>Cancelar</button>
                                        <button onClick={handleSavePassword} className='GuardarEditButton'>Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className='profdataview'>
                                    <p><strong>Nombre:</strong> {user.Nombre}</p>
                                    <p><strong>Apellidos:</strong> {user.Apellidos}</p>
                                    <p><strong>Email:</strong> {user.Email}</p>
                                    <p><strong>Contraseña:</strong> ••••••••</p>
                                    <p><strong>Total de proyectos:</strong> {totalProjects}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Cargando datos...</p>
                    )}
                </div>

                {!editMode && !passwordMode && (
                    <div className='ProfileOptions'>
                        <div className='editiconcontainer' onClick={() => setEditMode(true)} title="Editar datos">
                            <i className='bx bxs-edit-alt'></i>
                        </div>
                        <div className='editiconcontainer' onClick={() => setPasswordMode(true)} title="Cambiar contraseña">
                            <i className='bx bxs-lock-alt'></i>
                        </div>
                        <div className='deleteiconcontainer' onClick={handleDelete} title="Eliminar cuenta">
                            <i className='bx bxs-trash-alt'></i>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Profile;
