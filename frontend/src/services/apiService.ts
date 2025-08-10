import axios from 'axios';

// ========================================
// CONFIGURACIÓN DE AXIOS
// ========================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========================================
// TIPOS DE RESPUESTA
// ========================================

export interface BackendStatus {
  status: string;
  uptime: number;
  timestamp: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  environment: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ========================================
// SERVICIO PRINCIPAL DE API
// ========================================

export const apiService = {
  // ========================================
  // ENDPOINTS BÁSICOS
  // ========================================

  async getHealth(): Promise<BackendStatus> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  async getApiInfo(): Promise<any> {
    const response = await apiClient.get('/');
    return response.data;
  },

  // ========================================
  // AUTENTICACIÓN
  // ========================================

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  },

  async register(userData: { email: string; password: string; name: string }): Promise<ApiResponse> {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
  },

  // ========================================
  // CUENTAS AWS
  // ========================================

  async getAWSAccounts(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/api/aws/accounts');
    return response.data;
  },

  async addAWSAccount(accountData: {
    accountId: string;
    accountName: string;
    roleArn: string;
    region: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/api/aws/accounts', accountData);
    return response.data;
  },

  async deleteAWSAccount(accountId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/api/aws/accounts/${accountId}`);
    return response.data;
  },

  async assumeRole(accountId: string, mfaCode?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/api/aws/accounts/${accountId}/assume-role`, {
      mfaCode,
    });
    return response.data;
  },

  // ========================================
  // RECURSOS AWS
  // ========================================

  async getEC2Instances(accountId: string, region?: string): Promise<ApiResponse<any[]>> {
    const params = region ? { region } : {};
    const response = await apiClient.get(`/api/aws/accounts/${accountId}/ec2/instances`, { params });
    return response.data;
  },

  async getLoadBalancers(accountId: string, region?: string): Promise<ApiResponse<any[]>> {
    const params = region ? { region } : {};
    const response = await apiClient.get(`/api/aws/accounts/${accountId}/elb/load-balancers`, { params });
    return response.data;
  },

  async getVPCs(accountId: string, region?: string): Promise<ApiResponse<any[]>> {
    const params = region ? { region } : {};
    const response = await apiClient.get(`/api/aws/accounts/${accountId}/ec2/vpcs`, { params });
    return response.data;
  },

  async getCompleteInventory(accountId: string, region?: string): Promise<ApiResponse<any>> {
    const params = region ? { region } : {};
    const response = await apiClient.get(`/api/aws/accounts/${accountId}/inventory`, { params });
    return response.data;
  },

  // ========================================
  // CLOUDWATCH
  // ========================================

  async getMetrics(
    accountId: string,
    namespace: string,
    metricName: string,
    dimensions: Record<string, string>[] = []
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/api/aws/accounts/${accountId}/cloudwatch/metrics`, {
      namespace,
      metricName,
      dimensions,
    });
    return response.data;
  },

  async getLogGroups(accountId: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/api/aws/accounts/${accountId}/cloudwatch/log-groups`);
    return response.data;
  },

  async getLogStreams(accountId: string, logGroupName: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(
      `/api/aws/accounts/${accountId}/cloudwatch/log-groups/${encodeURIComponent(logGroupName)}/streams`
    );
    return response.data;
  },

  async getLogEvents(
    accountId: string,
    logGroupName: string,
    logStreamName: string,
    limit: number = 100
  ): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(
      `/api/aws/accounts/${accountId}/cloudwatch/log-groups/${encodeURIComponent(
        logGroupName
      )}/streams/${encodeURIComponent(logStreamName)}/events`,
      { params: { limit } }
    );
    return response.data;
  },

  // ========================================
  // DASHBOARDS
  // ========================================

  async getDashboards(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/api/dashboards');
    return response.data;
  },

  async createDashboard(dashboardData: {
    name: string;
    description?: string;
    widgets: any[];
    isPublic: boolean;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/api/dashboards', dashboardData);
    return response.data;
  },

  async updateDashboard(
    dashboardId: string,
    dashboardData: Partial<{
      name: string;
      description: string;
      widgets: any[];
      isPublic: boolean;
    }>
  ): Promise<ApiResponse> {
    const response = await apiClient.put(`/api/dashboards/${dashboardId}`, dashboardData);
    return response.data;
  },

  async deleteDashboard(dashboardId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/api/dashboards/${dashboardId}`);
    return response.data;
  },

  // ========================================
  // USUARIOS
  // ========================================

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  },

  async updateProfile(userData: Partial<{ name: string; email: string }>): Promise<ApiResponse> {
    const response = await apiClient.put('/api/users/profile', userData);
    return response.data;
  },

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put('/api/users/password', passwordData);
    return response.data;
  },
};

export default apiService;
