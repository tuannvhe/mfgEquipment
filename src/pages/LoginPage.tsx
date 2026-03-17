import { useState } from 'react'
import { Button, Input, Form, Typography } from 'antd'
import { User, Lock } from 'lucide-react'

const { Title, Text } = Typography

import { authService } from '../utils/authService'
import type { User as UserType } from '../types'

export default function LoginPage({ onLogin }: { onLogin: (user: UserType) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFinish = async (values: any) => {
    setLoading(true)
    setError('')
    try {
      const response = await authService.login(values.username, values.password)
      setLoading(false)
      onLogin(response.user)
    } catch (err: any) {
      console.error('Login error:', err)
      setError('Tên đăng nhập hoặc mật khẩu không đúng')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[url('/images/bgAI.png')] bg-cover bg-center bg-no-repeat bg-fixed bg-blend-overlay flex items-center justify-center p-4 fade-in relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#4C9C2E] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-[#2d5f1b] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="bg-transparent backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-[400px] z-10 border border-slate-100">
        <div className="text-center mb-8">
        <img src="./images/logoB.png" alt="VINATech" className="h-[50px] mx-auto object-contain opacity-80" />
          <Text className="text-black70 text-base font-medium">Hệ thống Quản lý Thiết bị (EMS)</Text>
        </div>

        <Form layout="vertical" onFinish={handleFinish} onValuesChange={() => setError('')} requiredMark={false} size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}>
            <Input 
              prefix={<User size={18} className="text-slate-400 mr-2" />} 
              placeholder="Tên đăng nhập (VD: admin)" 
              className="bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm font-medium rounded-xl h-[40px]"
            />
          </Form.Item>
          
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]} className="mb-2">
            <Input.Password 
              prefix={<Lock size={18} className="text-slate-400 mr-2" />} 
              placeholder="Mật khẩu" 
              className="bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm font-medium rounded-xl h-[40px]"
            />
          </Form.Item>

          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center text-sm text-white cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-slate-300 text-[#4C9C2E] focus:ring-[#4C9C2E]" />
              Ghi nhớ đăng nhập
            </label>
            <a href="#" className="flex-shrink-0 text-sm text-[#4C9C2E] hover:text-[#2d5f1b] font-medium" onClick={e => e.preventDefault()}>
              Quên mật khẩu?
            </a>
          </div>

          {error && <div className="text-red-500 animate-bounce text-sm mb-4 text-center font-medium">{error}</div>}

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading}
            style={{ background: 'linear-gradient(135deg, #4C9C2E 0%, #3a7a22 100%)', borderColor: 'transparent', fontWeight: 700, height: 48, boxShadow: '0 4px 14px rgba(76, 156, 46, 0.3)' }}
            className="rounded-xl mt-2 hover:opacity-90 transition-opacity"
          >
            Đăng nhập
          </Button>
        </Form>
        <div className="text-center mt-8 text-slate-200 text-xs font-medium">
          © {new Date().getFullYear()} VINATech VINA. Developed by EA Team Department
        </div>
      </div>
    </div>
  )
}
