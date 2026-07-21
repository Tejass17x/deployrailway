import axiosInstance from '../api/axiosInstance';

class AuthService {
  async register(data) {
    return await axiosInstance.post('/v1/auth/register', data);
  }

  async sendRegistrationOtp(email) {
    return await axiosInstance.post('/v1/auth/send-registration-otp', { email });
  }

  async verifyRegistrationOtp(email, otp) {
    return await axiosInstance.post('/v1/auth/verify-registration-otp', { email, otp });
  }

  async login(email, password) {
    return await axiosInstance.post('/v1/auth/login', { email, password });
  }

  async sendLoginOtp(email) {
    return await axiosInstance.post('/v1/auth/send-login-otp', { email });
  }

  async verifyLoginOtp(email, otp, rememberMe = false) {
    return await axiosInstance.post('/v1/auth/verify-login-otp', { email, otp, rememberMe });
  }

  async forgotPassword(email) {
    return await axiosInstance.post('/v1/auth/forgot-password', { email });
  }

  async resetPassword(email, otp, password, confirmPassword) {
    return await axiosInstance.post('/v1/auth/reset-password', { email, otp, password, confirmPassword });
  }

  async refreshToken(token = null) {
    return await axiosInstance.post('/v1/auth/refresh-token', { refreshToken: token });
  }

  async logout(token = null) {
    return await axiosInstance.post('/v1/auth/logout', { refreshToken: token });
  }

  async logoutAll() {
    return await axiosInstance.post('/v1/auth/logout-all');
  }

  async getMe() {
    return await axiosInstance.get('/v1/auth/me');
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return await axiosInstance.post('/v1/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
  }

  async deactivateAccount() {
    return await axiosInstance.post('/v1/auth/deactivate');
  }
}

export default new AuthService();
