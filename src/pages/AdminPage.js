import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  Summarize as SummarizeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAuth, USER_ROLES } from '../context/AuthContextCognito';
import { useAnalytics } from '../context/AnalyticsContext';
import dashboardDataService from '../services/dashboardDataService';
import unifiedAnalyticsService from '../services/unifiedAnalyticsService';
import { generateAnalyticsReport, generateSummaryReport } from '../utils/pdfGenerator'; // 기존 함수
import { 
  generateAIAnalyticsReport as generateAIChartReport, 
  generateAIContentReport, 
  generateAIAuthorReport,
  generateChartOnlyReport 
} from '../utils/aiPdfGenerator';
import { testBedrockConnection } from '../utils/bedrockClient';
import { 
  checkPythonPdfServerStatus, 
  generateAndDownloadAIReport 
} from '../utils/pythonPdfGenerator';
import { 
  generateAIAnalyticsReport as generateAIInsights,
  extractInsightsText 
} from '../utils/aiAnalyticsGenerator';
import { Navigate } from 'react-router-dom';

const AdminPage = () => {
  const { isAdmin } = useAuth();
  
  const { 
    clearAnalytics,
    debugCategoryData,
    analytics
  } = useAnalytics();
  
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [contentAnalytics, setContentAnalytics] = useState([]);
  const [authorAnalytics, setAuthorAnalytics] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [timeAnalytics, setTimeAnalytics] = useState([]);
  const [hourlyAnalytics, setHourlyAnalytics] = useState([]);
  const [accessPurposeAnalytics, setAccessPurposeAnalytics] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [aiConnectionStatus, setAiConnectionStatus] = useState('checking');
  const [pythonPdfStatus, setPythonPdfStatus] = useState('checking');
  const [unifiedAnalyticsData, setUnifiedAnalyticsData] = useState(null);

  // 데이터 로딩 함수 (통합 데이터 서비스 사용)
  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      console.log('🔄 [AdminPage] 통합 대시보드 데이터 로딩 시작...');
      
      // 통합 데이터 서비스로 한 번에 모든 데이터 수집
      const unifiedData = await unifiedAnalyticsService.gatherAllAnalyticsData();
      
      // 개별 state에 데이터 설정
      setAnalyticsSummary(unifiedData.summary);
      setContentAnalytics(unifiedData.content);
      setAuthorAnalytics(unifiedData.authors);
      setCategoryAnalytics(unifiedData.category);
      setTimeAnalytics(unifiedData.time);
      setHourlyAnalytics(unifiedData.hourly);
      setAccessPurposeAnalytics(unifiedData.accessPurpose);

      console.log(`✅ [AdminPage] 통합 대시보드 데이터 로딩 완료 (${unifiedData.metadata.totalDataPoints}개 데이터 포인트, 완성도: ${unifiedData.metadata.dataCompleteness}%)`);
      
      // 대시보드에서 사용할 데이터도 저장
      setUnifiedAnalyticsData(unifiedData);
    } catch (error) {
      console.error('❌ [AdminPage] 대시보드 데이터 로딩 실패:', error);
      alert('데이터 로딩에 실패했습니다: ' + error.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 데이터 새로고침 함수
  const handleRefreshData = async () => {
    console.log('🔄 [AdminPage] 수동 데이터 새로고침 시작...');
    await loadDashboardData();
    alert('📊 데이터가 성공적으로 새로고침되었습니다!');
  };

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  // AI 기반 PDF 다운로드 함수
  const handleDownloadAIReport = async () => {
    setIsGeneratingPDF(true);
    try {
      console.log('🤖 AI 기반 전체 리포트 PDF 생성 시작...');
      
      // 분석 데이터 준비
      const analyticsData = {
        summary: analyticsSummary,
        content: contentAnalytics,
        authors: authorAnalytics,
        category: categoryAnalytics,
        time: timeAnalytics,
        hourly: hourlyAnalytics,
        accessPurpose: accessPurposeAnalytics,
        period: selectedPeriod
      };
      
      const result = await generateAIInsights(analyticsData);
      
      if (result.success) {
        alert(`✅ AI 기반 PDF 리포트가 성공적으로 생성되었습니다!\n\n파일명: ${result.fileName}\n\n🤖 AI 인사이트가 포함된 전문적인 분석 리포트를 확인해보세요.`);
      } else {
        // AI 실패 시 기본 리포트 생성 옵션 제공
        const useBasic = window.confirm(`❌ AI 분석에 실패했습니다.\n\n${result.error}\n\n기본 리포트를 생성하시겠습니까?`);
        if (useBasic) {
          await handleDownloadFullReport();
        }
      }
    } catch (error) {
      console.error('AI PDF 생성 오류:', error);
      alert(`❌ AI PDF 생성 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // AI 기반 콘텐츠 리포트 생성
  const handleDownloadAIContentReport = async () => {
    setIsGeneratingPDF(true);
    try {
      console.log('📄 AI 콘텐츠 리포트 생성 시작...');
      
      const result = await generateAIContentReport(contentAnalytics);
      
      if (result.success) {
        alert(`✅ AI 콘텐츠 분석 리포트가 생성되었습니다!\n\n파일명: ${result.fileName}`);
      } else {
        alert(`❌ AI 콘텐츠 분석 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('AI 콘텐츠 리포트 생성 오류:', error);
      alert(`❌ 오류 발생: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // AI 기반 작성자 리포트 생성
  const handleDownloadAIAuthorReport = async () => {
    setIsGeneratingPDF(true);
    try {
      console.log('✍️ AI 작성자 리포트 생성 시작...');
      
      const result = await generateAIAuthorReport(authorAnalytics);
      
      if (result.success) {
        alert(`✅ AI 작성자 분석 리포트가 생성되었습니다!\n\n파일명: ${result.fileName}`);
      } else {
        alert(`❌ AI 작성자 분석 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('AI 작성자 리포트 생성 오류:', error);
      alert(`❌ 오류 발생: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 새로운 한글 AI PDF 다운로드 함수
  const handleDownloadKoreanAIReport = async () => {
    setIsGeneratingPDF(true);
    try {
      console.log('🤖 한글 AI 리포트 생성 시작...');
      
      // 사용자에게 진행 상황 알림
      const loadingAlert = document.createElement('div');
      loadingAlert.id = 'pdf-loading-alert';
      loadingAlert.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-family: Arial, sans-serif;
      `;
      loadingAlert.innerHTML = `
        <div style="margin-bottom: 10px;">🤖 한글 AI 리포트 생성 중...</div>
        <div style="font-size: 14px;">Amazon Bedrock으로 인사이트 생성 및 PDF 조합 중입니다.</div>
        <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">잠시만 기다려주세요...</div>
      `;
      document.body.appendChild(loadingAlert);
      
      // 약간의 지연을 두어 UI 업데이트 시간 확보
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 통합 분석 데이터 수집 (한 번에 모든 데이터 수집)
      console.log('🔄 통합 분석 데이터 수집 시작...');
      const analyticsData = await unifiedAnalyticsService.gatherAllAnalyticsData();

      console.log('📊 통합 분석 데이터:', analyticsData);
      console.log(`📈 데이터 포인트: ${analyticsData.metadata.totalDataPoints}개, 완성도: ${analyticsData.metadata.dataCompleteness}%`);

      // AI 인사이트 생성 (통합 데이터 사용)
      const result = await generateAIInsights(analyticsData);
      
      // 로딩 알림 제거
      const alertElement = document.getElementById('pdf-loading-alert');
      if (alertElement) {
        document.body.removeChild(alertElement);
      }
      
      if (result.success) {
        console.log('✅ AI 인사이트 생성 성공:', result.data);
        
        // AI 인사이트 텍스트 추출
        const insightsText = extractInsightsText(result.data);
        console.log('📝 추출된 인사이트 텍스트:', insightsText.substring(0, 200) + '...');
        
        // AI PDF 생성기로 차트 포함 PDF 생성
        console.log('📈 AI Chart.js 기반 PDF 생성 시작...');
        
        try {
          // 이미 생성된 AI 인사이트를 전달하여 중복 호출 방지
          const pdfResult = await generateAIChartReport(analyticsData, result.data);
          
          if (pdfResult.success) {
            alert(`✅ 차트가 포함된 AI 리포트가 성공적으로 생성되었습니다!\n\n📄 파일명: ${pdfResult.fileName}\n📁 다운로드 폴더를 확인해주세요.`);
          } else {
            throw new Error(pdfResult.error);
          }
        } catch (aiError) {
          console.error('❌ AI PDF 생성 실패:', aiError.message);
          
          // Bedrock API 제한 오류인 경우 차트 전용 PDF 생성
          if (aiError.message.includes('요청이 너무 많습니다') || aiError.message.includes('rate limit')) {
            console.log('📈 차트 전용 PDF 생성 시도...');
            
            const chartResult = await generateChartOnlyReport(analyticsData, insightsText);
            
            if (chartResult.success) {
              alert(`✅ 차트가 포함된 분석 리포트가 성공적으로 생성되었습니다!\n\n📄 파일명: ${chartResult.fileName}\n📁 다운로드 폴더를 확인해주세요.\n\nℹ️ AI 인사이트는 API 제한으로 인해 생략되었습니다.`);
            } else {
              throw new Error(chartResult.error);
            }
          } else {
            throw aiError;
          }
        }
      } else {
        console.error('❌ AI 인사이트 생성 실패:', result.error);
        
        // AI 인사이트 실패 시 차트 전용 PDF 생성 제안
        const useChartOnly = window.confirm(`❌ AI 분석에 실패했습니다.\n\n${result.error}\n\n차트만 포함된 분석 리포트를 생성하시겠습니까?`);
        
        if (useChartOnly) {
          console.log('📈 차트 전용 PDF 생성 시도...');
          
          const chartResult = await generateChartOnlyReport(analyticsData);
          
          if (chartResult.success) {
            alert(`✅ 차트가 포함된 분석 리포트가 성공적으로 생성되었습니다!\n\n📄 파일명: ${chartResult.fileName}\n📁 다운로드 폴더를 확인해주세요.`);
          } else {
            console.error('❌ 차트 전용 PDF 생성 실패:', chartResult.error);
            
            // 최종 대체 방안으로 기본 리포트 생성
            const useBasic = window.confirm(`차트 생성도 실패했습니다.\n\n기본 리포트를 생성하시겠습니까?`);
            if (useBasic) {
              await handleDownloadFullReport();
            }
          }
        }
      }
    } catch (error) {
      // 로딩 알림 제거
      const alertElement = document.getElementById('pdf-loading-alert');
      if (alertElement) {
        document.body.removeChild(alertElement);
      }
      
      console.error('한글 AI 리포트 생성 오류:', error);
      alert(`❌ 오류 발생: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 기본 PDF 다운로드 함수
  const handleDownloadFullReport = async () => {
    setIsGeneratingPDF(true);
    try {
      console.log('📊 전체 리포트 PDF 생성 시작...');
      
      // 사용자에게 진행 상황 알림
      const loadingAlert = document.createElement('div');
      loadingAlert.id = 'pdf-loading-alert';
      loadingAlert.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-family: Arial, sans-serif;
      `;
      loadingAlert.innerHTML = `
        <div style="margin-bottom: 10px;">📊 PDF 생성 중...</div>
        <div style="font-size: 14px;">차트 캡처 및 데이터 처리 중입니다.</div>
        <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">잠시만 기다려주세요...</div>
      `;
      document.body.appendChild(loadingAlert);
      
      // 약간의 지연을 두어 UI 업데이트 시간 확보
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const analyticsData = {
        summary: analyticsSummary,
        accessPurpose: accessPurposeAnalytics,
        content: contentAnalytics,
        category: categoryAnalytics,
        time: timeAnalytics,
        hourly: hourlyAnalytics
      };

      console.log('📊 분석 데이터:', analyticsData);

      const result = await generateAnalyticsReport(analyticsData);
      
      // 로딩 알림 제거
      const alertElement = document.getElementById('pdf-loading-alert');
      if (alertElement) {
        document.body.removeChild(alertElement);
      }
      
      if (result.success) {
        console.log('✅ PDF 생성 성공:', result.fileName);
        alert(`✅ 전체 분석 리포트가 성공적으로 생성되었습니다!\n\n📄 파일명: ${result.fileName}\n📁 다운로드 폴더를 확인해주세요.\n\n📊 포함된 내용:\n• 전체 통계 및 차트\n• 접속 목적 분석\n• 콘텐츠 분석\n• 카테고리 분석\n• 시간대 분석`);
      } else {
        console.error('❌ PDF 생성 실패:', result.error);
        alert(`❌ PDF 생성 중 오류가 발생했습니다:\n${result.error}\n\n다시 시도해주세요.`);
      }
    } catch (error) {
      // 로딩 알림 제거
      const alertElement = document.getElementById('pdf-loading-alert');
      if (alertElement) {
        document.body.removeChild(alertElement);
      }
      
      console.error('PDF 생성 오류:', error);
      alert(`PDF 생성 중 오류가 발생했습니다:\n${error.message}\n\n브라우저를 새로고침 후 다시 시도해주세요.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 요약 리포트 다운로드
  const handleDownloadSummary = async () => {
    setIsGeneratingPDF(true);
    try {
      const result = await generateSummaryReport(analyticsSummary);
      if (result.success) {
        alert(`✅ 요약 리포트가 성공적으로 생성되었습니다!\n파일명: ${result.fileName}`);
      } else {
        alert(`❌ PDF 생성 중 오류가 발생했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 개별 섹션 PDF 다운로드
  const handleDownloadSectionPDF = async (sectionType) => {
    setIsGeneratingPDF(true);
    try {
      let analyticsData = {};

      switch (sectionType) {
        case 'access-purpose':
          analyticsData = {
            summary: analyticsSummary,
            accessPurpose: accessPurposeAnalytics
          };
          break;
        case 'content':
          analyticsData = {
            summary: analyticsSummary,
            content: contentAnalytics
          };
          break;
        case 'category':
          analyticsData = {
            summary: analyticsSummary,
            category: categoryAnalytics
          };
          break;
        case 'time':
          analyticsData = {
            summary: analyticsSummary,
            time: timeAnalytics,
            hourly: hourlyAnalytics
          };
          break;
        default:
          throw new Error('Unknown section type');
      }

      const result = await generateAnalyticsReport(analyticsData);
      if (result.success) {
        alert(`✅ 섹션별 PDF가 성공적으로 생성되었습니다!`);
      } else {
        alert(`❌ PDF 생성 중 오류가 발생했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // AWS 설정 (보안 강화됨 - 로컬 credentials 사용)
  useEffect(() => {
    console.log('🔧 [AdminPage] AWS 설정 완료 (로컬 credentials 사용):', {
      defaultRegion: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      cognitoRegion: process.env.REACT_APP_COGNITO_REGION || 'us-west-2',
      credentialSource: 'Local ~/.aws/credentials',
      securityLevel: 'Enhanced'
    });
  }, []);

  // Cognito에서 사용자 목록 가져오기 (백엔드 API 사용)
  const fetchCognitoUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('👥 백엔드 API를 통한 사용자 목록 조회 시작...');
      
      const backendUrl = process.env.REACT_APP_BACKEND_API_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/cognito/users`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 사용자 목록 조회 성공:', data.users);
        
        // 로컬 스토리지에서 추가 정보 가져오기
        const userExtraInfo = JSON.parse(localStorage.getItem('userExtraInfo') || '[]');
        
        const usersWithExtraInfo = data.users.map(user => {
          const extraInfo = userExtraInfo.find(info => info.email === user.email) || {};
          return {
            ...user,
            company: extraInfo.company || '미입력',
            purpose: extraInfo.purpose || '미입력'
          };
        });
        
        setUsers(usersWithExtraInfo);
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('❌ 사용자 목록 조회 실패:', error);
      alert(`사용자 목록을 불러오는데 실패했습니다: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 사용자 그룹 변경 함수 (백엔드 API 사용)
  const changeUserRole = async (username, newRole) => {
    try {
      console.log(`🔄 사용자 ${username}의 역할을 ${newRole}로 변경 시작...`);
      
      const backendUrl = process.env.REACT_APP_BACKEND_API_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/cognito/users/${username}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 역할 변경 성공:', data.message);
        await fetchCognitoUsers(); // 사용자 목록 새로고침
        alert(data.message);
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('❌ 사용자 역할 변경 실패:', error);
      alert(`역할 변경에 실패했습니다: ${error.message}`);
    }
  };

  // 사용자 계정 삭제
  // 사용자 계정 삭제 (백엔드 API 사용)
  const deleteUser = async (username) => {
    try {
      console.log('🗑️ [AdminPage] 사용자 삭제 시작:', username);
      
      const backendUrl = process.env.REACT_APP_BACKEND_API_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/cognito/users/${username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ [AdminPage] 사용자 삭제 성공:', username);
        
        // 사용자 목록 새로고침
        await fetchCognitoUsers();
        alert(`사용자 "${username}"이 성공적으로 삭제되었습니다.`);
      } else {
        throw new Error(data.error || '사용자 삭제 실패');
      }
      
    } catch (error) {
      console.error('❌ 사용자 삭제 실패:', error);
      alert(`사용자 삭제에 실패했습니다: ${error.message}`);
    }
  };
  // 임시 비밀번호 생성 함수
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    
    // 최소 요구사항: 대문자, 소문자, 숫자, 특수문자 각 1개씩
    password += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]; // 대문자
    password += 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 24)]; // 소문자
    password += '23456789'[Math.floor(Math.random() * 8)]; // 숫자
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // 특수문자
    
    // 나머지 4자리 랜덤 생성 (총 8자리)
    for (let i = 0; i < 4; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // 문자 순서 섞기
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // 사용자 비밀번호 초기화
  // 사용자 비밀번호 초기화 (백엔드 API 사용)
  const resetUserPassword = async (username, userEmail) => {
    try {
      console.log('🔑 [AdminPage] 비밀번호 초기화 시작:', username);
      
      const backendUrl = process.env.REACT_APP_BACKEND_API_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/cognito/users/${username}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ [AdminPage] 비밀번호 초기화 성공:', username);
        
        // 임시 비밀번호를 클립보드에 복사
        try {
          await navigator.clipboard.writeText(data.tempPassword);
          console.log('📋 [AdminPage] 임시 비밀번호 클립보드 복사 완료');
        } catch (clipboardError) {
          console.warn('⚠️ [AdminPage] 클립보드 복사 실패:', clipboardError);
        }
        
        // 사용자에게 안내 메시지
        const message = `✅ 비밀번호 초기화 완료!\n\n` +
                       `사용자: ${username} (${userEmail})\n` +
                       `임시 비밀번호: ${data.tempPassword}\n\n` +
                       `📋 임시 비밀번호가 클립보드에 복사되었습니다.\n\n` +
                       `⚠️ 보안 주의사항:\n` +
                       `• 이 비밀번호를 안전한 방법으로 사용자에게 전달하세요\n` +
                       `• 사용자는 다음 로그인 시 새 비밀번호로 변경해야 합니다\n` +
                       `• 이 창을 닫은 후 임시 비밀번호는 다시 확인할 수 없습니다`;
        
        alert(message);
      } else {
        throw new Error(data.error || '비밀번호 초기화 실패');
      }
      
    } catch (error) {
      console.error('❌ 비밀번호 초기화 실패:', error);
      alert(`비밀번호 초기화에 실패했습니다: ${error.message}`);
    }
  };

  // 차트 색상
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // 방문 목적별 색상 (Skip은 특별한 색상)
  const getPurposeColor = (purpose, index) => {
    if (purpose === 'Skipped') {
      return '#FF6B6B'; // 빨간색 계열로 Skip 강조
    }
    return COLORS[index % COLORS.length];
  };

  // 역할 표시명 반환 함수 추가
  const getRoleDisplayName = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return '관리자';
      case USER_ROLES.CONTENT_MANAGER:
        return '콘텐츠 관리자';
      case USER_ROLES.CONTRIBUTOR:
        return '컨텐츠 업로더';
      case USER_ROLES.VIEWER:
        return '일반 사용자';
      default:
        return role;
    }
  };

  // 역할별 색상 반환 함수 추가
  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'error';
      case USER_ROLES.CONTENT_MANAGER:
        return 'warning';
      case USER_ROLES.CONTRIBUTOR:
        return 'success';
      case USER_ROLES.VIEWER:
        return 'default';
      default:
        return 'default';
    }
  };

  // 가입 목적 표시명 변환
  const getPurposeDisplayName = (purpose) => {
    switch (purpose) {
      case 'aws-internal': return '🏢 AWS 내부 직원';
      case 'customer-demo': return '👥 고객사 데모 제공';
      case 'partner-collaboration': return '🤝 파트너 협업';
      case 'technical-evaluation': return '🔍 기술 평가 및 검토';
      case 'business-development': return '📈 비즈니스 개발';
      case 'education-training': return '📚 교육 및 트레이닝';
      case 'research-development': return '🔬 연구 개발';
      case 'other': return '🔧 기타';
      default: return '미입력';
    }
  };

  // 역할 변경 핸들러
  const handleRoleChange = async () => {
    if (selectedUser && newRole) {
      await changeUserRole(selectedUser.username, newRole);
      setRoleChangeDialog(false);
      setSelectedUser(null);
      setNewRole('');
    }
  };

  useEffect(() => {
    // AI 연결 상태 확인
    const checkAIConnection = async () => {
      if (useAI) {
        try {
          const isBedrockConnected = await testBedrockConnection();
          const isPythonPdfConnected = await checkPythonPdfServerStatus();
          
          setAiConnectionStatus(isBedrockConnected ? 'connected' : 'error');
          setPythonPdfStatus(isPythonPdfConnected ? 'connected' : 'error');
        } catch (error) {
          console.error('AI 연결 확인 실패:', error);
          setAiConnectionStatus('error');
          setPythonPdfStatus('error');
        }
      }
    };

    checkAIConnection();
  }, [useAI]);

  useEffect(() => {
    // 분석 데이터 로드 (비동기 처리)
    const loadAnalyticsData = async () => {
      try {
        console.log('📊 [AdminPage] 분석 데이터 로딩 시작...');
        
        // 실시간 데이터 로드
        const summary = await dashboardDataService.getAnalyticsSummary();
        setAnalyticsSummary(summary);

        // 콘텐츠 분석 데이터 로드
        const contentData = await dashboardDataService.getContentAnalytics(selectedPeriod);
        setContentAnalytics(contentData);

        // 작성자 분석 데이터 로드
        const authorData = await dashboardDataService.getAuthorAnalytics();
        setAuthorAnalytics(authorData);

        // 카테고리 분석 데이터 로드
        const categoryData = await dashboardDataService.getCategoryAnalytics();
        setCategoryAnalytics(categoryData);

        // 시간별 분석 데이터 로드
        const timeData = await dashboardDataService.getTimeAnalytics(selectedPeriod);
        setTimeAnalytics(timeData);

        // 시간대별 분석 데이터 로드
        const hourlyData = await dashboardDataService.getHourlyAnalytics();
        setHourlyAnalytics(hourlyData);

        // 접속 목적 분석 데이터 로드
        const accessPurposeData = await dashboardDataService.getAccessPurposeAnalytics();
        setAccessPurposeAnalytics(accessPurposeData);
        
        console.log('✅ [AdminPage] 분석 데이터 로딩 완료:', {
          totalVisitors: summary.totalVisitors,
          totalPageViews: summary.totalPageViews,
          totalContentViews: summary.totalContentViews,
          contentAnalyticsCount: contentData.length,
          accessPurposesCount: accessPurposeData.length
        });
        
      } catch (error) {
        console.error('❌ [AdminPage] 분석 데이터 로딩 실패:', error);
      }
    };
    
    loadAnalyticsData();
    
    // Cognito에서 사용자 목록 로드
    fetchCognitoUsers();
  }, [selectedPeriod]);
  


  // 관리자 권한 확인
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        📊 관리자 대시보드
      </Typography>

      {/* AI 기능 안내 */}
      {useAI && (
        <Alert 
          severity={aiConnectionStatus === 'connected' && pythonPdfStatus === 'connected' ? 'success' : 'error'}
          icon={<AutoAwesomeIcon />}
          sx={{ mb: 3, backgroundColor: aiConnectionStatus === 'connected' && pythonPdfStatus === 'connected' ? '#E8F5E8' : '#FFEBEE', borderColor: '#FF9900' }}
        >
          <Typography variant="body2">
            <strong>🤖 AI 분석 모드 {aiConnectionStatus === 'connected' && pythonPdfStatus === 'connected' ? '활성화' : '오류'}</strong><br/>
            {aiConnectionStatus === 'connected' && pythonPdfStatus === 'connected' && 'Amazon Bedrock의 Claude 4 Sonnet 모델과 Python PDF 생성기가 연결되어 고품질 한글 리포트를 제공합니다.'}
            {(aiConnectionStatus === 'error' || pythonPdfStatus === 'error') && (
              <>
                {aiConnectionStatus === 'error' && 'Bedrock API 서버 연결 실패. '}
                {pythonPdfStatus === 'error' && 'Python PDF 서버 연결 실패. '}
                서버 상태를 확인해주세요.
              </>
            )}
            {aiConnectionStatus === 'connected' && pythonPdfStatus === 'connected' && <><br/>AI 분석에는 몇 분이 소요될 수 있습니다.</>}
          </Typography>
        </Alert>
      )}

      {/* 기간 선택 및 초기화 버튼 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>분석 기간</InputLabel>
          <Select
            value={selectedPeriod}
            label="분석 기간"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value="day">오늘</MenuItem>
            <MenuItem value="week">최근 7일</MenuItem>
            <MenuItem value="month">최근 30일</MenuItem>
            <MenuItem value="all">전체</MenuItem>
          </Select>
        </FormControl>
        
        {/* AI 사용 여부 토글 */}
        <FormControlLabel
          control={
            <Switch
              checked={useAI}
              onChange={(e) => {
                setUseAI(e.target.checked);
                setAiConnectionStatus('checking');
              }}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AutoAwesomeIcon sx={{ fontSize: 16, color: useAI ? '#FF9900' : 'text.secondary' }} />
              <Typography variant="body2" color={useAI ? 'primary' : 'text.secondary'}>
                AI 분석
              </Typography>
              {useAI && (
                <Box sx={{ ml: 1 }}>
                  {aiConnectionStatus === 'checking' && (
                    <CircularProgress size={12} />
                  )}
                  {aiConnectionStatus === 'connected' && (
                    <Chip 
                      label="연결됨" 
                      size="small" 
                      color="success" 
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  )}
                  {aiConnectionStatus === 'error' && (
                    <Chip 
                      label="오류" 
                      size="small" 
                      color="error" 
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  )}
                </Box>
              )}
            </Box>
          }
          sx={{ ml: 2 }}
        />
        
        {/* AI 기반 전체 리포트 버튼 */}
        <Tooltip title={useAI ? "Amazon Bedrock Claude 4 Sonnet을 사용한 AI 인사이트 포함" : "기본 데이터 리포트"}>
          <span>
            <Button
              variant="contained"
              color={useAI ? "secondary" : "success"}
              size="small"
              onClick={useAI ? handleDownloadKoreanAIReport : handleDownloadFullReport}
              disabled={isGeneratingPDF}
              startIcon={
                isGeneratingPDF ? 
                  <CircularProgress size={16} color="inherit" /> : 
                  useAI ? <PsychologyIcon /> : <GetAppIcon />
              }
              sx={{ 
                ml: 1,
                minWidth: '180px',
                backgroundColor: useAI ? '#FF9900' : '#4CAF50',
                '&:hover': {
                  backgroundColor: useAI ? '#E88B00' : '#45a049'
                }
              }}
            >
              {isGeneratingPDF ? 
                (useAI ? 'AI 분석 중...' : 'PDF 생성 중...') : 
                (useAI ? '🤖 AI 리포트 PDF' : '📊 기본 리포트 PDF')
              }
            </Button>
          </span>
        </Tooltip>
        
        <Button
          variant="outlined"
          onClick={handleRefreshData}
          disabled={isLoadingData}
          startIcon={isLoadingData ? <CircularProgress size={16} /> : <RefreshIcon />}
          sx={{ ml: 1, minWidth: '120px' }}
        >
          {isLoadingData ? '로딩 중...' : '데이터 새로고침'}
        </Button>
        
        <Button
          variant="outlined"
          color="success"
          size="small"
          onClick={handleDownloadSummary}
          disabled={isGeneratingPDF}
          startIcon={<SummarizeIcon />}
          sx={{ 
            ml: 1,
            minWidth: '140px',
            borderColor: '#4CAF50',
            color: '#4CAF50',
            '&:hover': {
              borderColor: '#45a049',
              backgroundColor: 'rgba(76, 175, 80, 0.04)'
            }
          }}
        >
          📋 요약 PDF
        </Button>
        
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => {
            if (window.confirm('모든 분석 데이터를 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
              clearAnalytics();
              // 데이터 다시 로드
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }}
          sx={{ ml: 'auto' }}
        >
          🧹 데이터 초기화
        </Button>
        
        <Button
          variant="outlined"
          color="warning"
          size="small"
          onClick={() => {
            if (window.confirm('세션 데이터를 초기화하시겠습니까?\n\n접속 목적 팝업이 다시 나타납니다.')) {
              sessionStorage.clear();
              alert('세션 초기화 완료! 홈페이지 방문 시 접속 목적 팝업이 나타납니다.');
            }
          }}
          sx={{ ml: 1 }}
        >
          🔄 세션 초기화
        </Button>
        
        <Button
          variant="outlined"
          color="info"
          size="small"
          onClick={debugCategoryData}
          sx={{ ml: 1 }}
        >
          🔍 카테고리 디버그
        </Button>
      </Box>

      {/* 로딩 상태 표시 */}
      {isLoadingData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            대시보드 데이터 로딩 중...
          </Typography>
        </Box>
      )}

      {/* 통계 카드 */}
      {!isLoadingData && (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.8 }}>
                총 방문자 수
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {analytics?.totalVisitors || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                고유 방문자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.8 }}>
                총 페이지 뷰
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {analyticsSummary?.totalContentViews || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                실제 콘텐츠 조회
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.8 }}>
                콘텐츠 조회수
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {contentAnalytics.reduce((sum, item) => sum + (item.views || 0), 0)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                실제 콘텐츠 조회
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.8 }}>
                인기 카테고리
              </Typography>
              <Typography variant="h6" component="div" fontWeight="bold">
                {categoryAnalytics[0]?.name || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {categoryAnalytics[0]?.totalViews || 0} 조회
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: (() => {
              const skippedData = accessPurposeAnalytics?.find(p => p.purpose === 'Skipped');
              const skippedPercentage = skippedData?.percentage || 0;
              if (skippedPercentage > 30) {
                return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'; // 높은 비율 - 빨간색
              } else if (skippedPercentage > 10) {
                return 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)'; // 중간 비율 - 주황색
              } else {
                return 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)'; // 낮은 비율 - 초록색
              }
            })(),
            color: 'white' 
          }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.8 }}>
                ⏭️ 목적 선택 Skip
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {accessPurposeAnalytics?.find(p => p.purpose === 'Skipped')?.count || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {accessPurposeAnalytics?.find(p => p.purpose === 'Skipped')?.percentage || 0}% 건너뜀
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* 탭 네비게이션 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="📈 트렌드 분석" />
          <Tab label="📄 콘텐츠 분석" />
          <Tab label="✍️ 작성자 분석" />
          <Tab label="📂 카테고리 분석" />
          <Tab label="🕐 시간대 분석" />
          <Tab label="🎯 접속 목적 분석" />
          <Tab label="👥 사용자 관리" />
        </Tabs>
      </Paper>

      {/* 탭 콘텐츠 */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* 일별 트렌드 */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 {selectedPeriod === 'week' ? '주간' : selectedPeriod === 'month' ? '월간' : '일간'} 트렌드
              </Typography>
              <ResponsiveContainer width="100%" height={300} id="daily-trend-chart">
                <AreaChart data={timeAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={selectedPeriod === 'week' ? 'day' : 'date'} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `날짜: ${label}`}
                    formatter={(value, name) => {
                      if (name === 'pageViews') return [value, '페이지 조회'];
                      if (name === 'contentViews') return [value, '콘텐츠 조회'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#8884d8" 
                    fill="url(#colorViews)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="contentViews" 
                    stroke="#82ca9d" 
                    fill="url(#colorContentViews)"
                  />
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorContentViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* 접속 목적 분석 */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🎯 접속 목적 분석
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleDownloadSectionPDF('access-purpose')}
                  disabled={isGeneratingPDF}
                  startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <GetAppIcon />}
                  sx={{
                    minWidth: '120px',
                    fontSize: '0.75rem'
                  }}
                >
                  {isGeneratingPDF ? '생성 중...' : 'PDF 다운로드'}
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300} id="purpose-pie-chart">
                <PieChart>
                  <Pie
                    data={Object.entries(analyticsSummary?.accessPurposes || {}).map(([purpose, count]) => ({
                      name: purpose,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(analyticsSummary?.accessPurposes || {}).map(([purpose, count], index) => (
                      <Cell key={`cell-${index}`} fill={getPurposeColor(purpose, index)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* 인기 콘텐츠 랭킹 */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🏆 인기 콘텐츠 랭킹 ({selectedPeriod === 'all' ? '전체' : selectedPeriod === 'week' ? '주간' : selectedPeriod === 'month' ? '월간' : '일간'})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="AI가 콘텐츠 성과를 분석하고 인사이트를 제공합니다">
                    <span>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        onClick={handleDownloadAIContentReport}
                        disabled={isGeneratingPDF}
                        startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <PsychologyIcon />}
                        sx={{
                          minWidth: '140px',
                          fontSize: '0.75rem',
                          backgroundColor: '#FF9900',
                          '&:hover': { backgroundColor: '#E88B00' }
                        }}
                      >
                        {isGeneratingPDF ? 'AI 분석 중...' : '🤖 AI 분석 PDF'}
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleDownloadSectionPDF('content')}
                    disabled={isGeneratingPDF}
                    startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <GetAppIcon />}
                    sx={{
                      minWidth: '120px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {isGeneratingPDF ? '생성 중...' : '기본 PDF'}
                  </Button>
                </Box>
              </Box>
              {contentAnalytics.length > 0 ? (
                <List>
                  {contentAnalytics.slice(0, 10).map((content, index) => (
                    <React.Fragment key={content.contentId}>
                      <ListItem>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              minWidth: 40, 
                              color: index < 3 ? '#ff6b35' : 'text.secondary',
                              fontWeight: index < 3 ? 'bold' : 'normal'
                            }}
                          >
                            #{index + 1}
                          </Typography>
                          <Box sx={{ flexGrow: 1, ml: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {content.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={content.category} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`작성자: ${content.author}`} 
                                size="small" 
                                color="info"
                                variant="outlined"
                              />
                              <Chip 
                                label={`총 ${content.views || 0}회`} 
                                size="small" 
                                color="secondary"
                              />
                              <Chip 
                                label={`❤️ 좋아요 ${content.likes || 0}개`} 
                                size="small" 
                                color="error"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < contentAnalytics.slice(0, 10).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">콘텐츠 조회 데이터가 없습니다.</Alert>
              )}
            </Paper>
          </Grid>

          {/* 콘텐츠 조회수 차트 */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 상위 콘텐츠 조회수
              </Typography>
              <ResponsiveContainer width="100%" height={300} id="content-bar-chart">
                <BarChart data={contentAnalytics.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="title" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, '조회수']}
                    labelFormatter={(label) => `콘텐츠: ${label}`}
                  />
                  <Bar dataKey="periodViews" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* 작성자 순위 */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  ✍️ 작성자 순위 ({selectedPeriod === 'all' ? '전체' : selectedPeriod === 'week' ? '주간' : selectedPeriod === 'month' ? '월간' : '일간'})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="AI가 작성자 성과를 분석하고 개선 방안을 제안합니다">
                    <span>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        onClick={handleDownloadAIAuthorReport}
                        disabled={isGeneratingPDF}
                        startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <PsychologyIcon />}
                        sx={{
                          minWidth: '140px',
                          fontSize: '0.75rem',
                          backgroundColor: '#FF9900',
                          '&:hover': { backgroundColor: '#E88B00' }
                        }}
                      >
                        {isGeneratingPDF ? 'AI 분석 중...' : '🤖 AI 분석 PDF'}
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleDownloadSectionPDF('author')}
                    disabled={isGeneratingPDF}
                    startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <GetAppIcon />}
                    sx={{
                      minWidth: '120px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {isGeneratingPDF ? '생성 중...' : '기본 PDF'}
                  </Button>
                </Box>
              </Box>
              {authorAnalytics.length > 0 ? (
                <List>
                  {authorAnalytics.slice(0, 10).map((author, index) => (
                    <React.Fragment key={author.author}>
                      <ListItem>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              minWidth: 40, 
                              color: index < 3 ? '#ff6b35' : 'text.secondary',
                              fontWeight: index < 3 ? 'bold' : 'normal'
                            }}
                          >
                            #{index + 1}
                          </Typography>
                          <Box sx={{ flexGrow: 1, ml: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {author.author}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={`콘텐츠 ${author.contentCount}개`} 
                                size="small" 
                                color="primary"
                              />
                              <Chip 
                                label={`총 조회수 ${author.totalViews.toLocaleString()}회`} 
                                size="small" 
                                color="secondary"
                              />
                              <Chip 
                                label={`총 좋아요 ${author.totalLikes.toLocaleString()}개`} 
                                size="small" 
                                color="error"
                                variant="outlined"
                              />
                              <Chip 
                                label={`평균 조회수 ${author.avgViews.toLocaleString()}회`} 
                                size="small" 
                                color="success"
                              />
                            </Box>
                            {/* 작성자의 인기 콘텐츠 미리보기 */}
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                인기 콘텐츠: {author.contents && author.contents.length > 0 
                                  ? author.contents.slice(0, 2).map(content => content.title).join(', ')
                                  : 'N/A'}
                                {author.contents && author.contents.length > 2 && ` 외 ${author.contents.length - 2}개`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                카테고리: {author.categories && author.categories.length > 0 ? author.categories.join(', ') : 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < authorAnalytics.slice(0, 10).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">작성자 데이터가 없습니다.</Alert>
              )}
            </Paper>
          </Grid>

          {/* 작성자 통계 차트 */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 상위 작성자 통계
              </Typography>
              <ResponsiveContainer width="100%" height={300} id="author-bar-chart">
                <BarChart data={authorAnalytics.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="author" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalViews') return [value.toLocaleString(), '총 조회수'];
                      if (name === 'totalLikes') return [value.toLocaleString(), '총 좋아요'];
                      if (name === 'totalContents') return [value, '콘텐츠 수'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `작성자: ${label}`}
                  />
                  <Bar dataKey="totalViews" fill="#8884d8" name="totalViews" />
                  <Bar dataKey="contentCount" fill="#82ca9d" name="totalContents" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* 카테고리별 인기도 */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  📂 카테고리별 인기도
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleDownloadSectionPDF('category')}
                  disabled={isGeneratingPDF}
                  startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <GetAppIcon />}
                  sx={{
                    minWidth: '120px',
                    fontSize: '0.75rem'
                  }}
                >
                  {isGeneratingPDF ? '생성 중...' : 'PDF 다운로드'}
                </Button>
              </Box>
              {categoryAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} id="category-bar-chart">
                  <BarChart data={categoryAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'totalViews') return [value, '총 조회수'];
                        if (name === 'contentCount') return [value, '콘텐츠 수'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `카테곣리: ${label}`}
                    />
                    <Legend 
                      formatter={(value) => {
                        if (value === 'totalViews') return '총 조회수';
                        if (value === 'contentCount') return '콘텐츠 수';
                        return value;
                      }}
                    />
                    <Bar dataKey="totalViews" fill="#82ca9d" name="totalViews" />
                    <Bar dataKey="contentCount" fill="#8884d8" name="contentCount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6">
                    📭 카테고리 데이터가 없습니다
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* 카테고리 상세 정보 */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📈 카테고리 상세 분석
              </Typography>
              {categoryAnalytics.length > 0 ? (
                <List>
                  {categoryAnalytics.map((category, index) => (
                    <React.Fragment key={category.name}>
                      <ListItem>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              minWidth: 40, 
                              color: index < 3 ? '#ff6b35' : 'text.secondary',
                              fontWeight: index < 3 ? 'bold' : 'normal'
                            }}
                          >
                            #{index + 1}
                          </Typography>
                          <Box sx={{ flexGrow: 1, ml: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {category.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={`총 ${category.totalViews || 0}회`} 
                                size="small" 
                                color="primary"
                              />
                              <Chip 
                                label={`콘텐츠 ${category.contentCount || 0}개`} 
                                size="small" 
                                color="secondary"
                              />
                              <Chip 
                                label={`평균 ${category.avgViews || 0}회`} 
                                size="small" 
                                color="info"
                                variant="outlined"
                              />
                              {category.lastViewed && (
                                <Chip 
                                  label={`최근 ${category.lastViewed}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < categoryAnalytics.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  카테고리 데이터가 없습니다. 콘텐츠를 조회하거나 카테고리 페이지를 방문해보세요.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* 시간대별 접속 패턴 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🕐 시간대별 접속 패턴
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleDownloadSectionPDF('time')}
                  disabled={isGeneratingPDF}
                  startIcon={isGeneratingPDF ? <CircularProgress size={14} /> : <GetAppIcon />}
                  sx={{
                    minWidth: '120px',
                    fontSize: '0.75rem'
                  }}
                >
                  {isGeneratingPDF ? '생성 중...' : 'PDF 다운로드'}
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300} id="hourly-chart">
                <AreaChart data={hourlyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hourLabel" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'pageViews') return [value, '페이지 조회'];
                      if (name === 'contentViews') return [value, '콘텐츠 조회'];
                      if (name === 'visitors') return [value, '방문자 수'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `시간: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#ff7300" 
                    fill="url(#colorHourly)"
                    name="pageViews"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="contentViews" 
                    stroke="#82ca9d" 
                    fill="url(#colorHourlyContent)"
                    name="contentViews"
                  />
                  <defs>
                    <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff7300" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorHourlyContent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                💡 피크 시간대: {hourlyAnalytics.reduce((max, current) => 
                  (current.pageViews || 0) > (max.pageViews || 0) ? current : max, 
                  { pageViews: 0, hourLabel: 'N/A' }
                ).hourLabel}
              </Typography>
            </Paper>
          </Grid>

          {/* 일자별 접속자 수 그래프 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📅 일자별 접속자 수 ({selectedPeriod === 'week' ? '최근 7일' : selectedPeriod === 'month' ? '최근 30일' : '전체'})
              </Typography>
              {timeAnalytics && timeAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} id="daily-visitors-chart">
                  <AreaChart data={timeAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `날짜: ${label}`}
                      formatter={(value, name) => {
                        if (name === 'visitors') return [value, '일일 방문자 수'];
                        if (name === 'pageViews') return [value, '일일 페이지 조회'];
                        if (name === 'contentViews') return [value, '일일 콘텐츠 조회'];
                        return [value, name];
                      }}
                    />
                    <Legend 
                      formatter={(value) => {
                        if (value === 'visitors') return '일일 방문자 수';
                        if (value === 'pageViews') return '일일 페이지 조회';
                        if (value === 'contentViews') return '일일 콘텐츠 조회';
                        return value;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#8884d8" 
                      fill="url(#colorDailyVisitors)"
                      name="visitors"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pageViews" 
                      stroke="#82ca9d" 
                      fill="url(#colorDailyPageViews)"
                      name="pageViews"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="contentViews" 
                      stroke="#ffc658" 
                      fill="url(#colorDailyContentViews)"
                      name="contentViews"
                    />
                    <defs>
                      <linearGradient id="colorDailyVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorDailyPageViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorDailyContentViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6">
                    📅 일자별 데이터가 없습니다
                  </Typography>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                📈 최고 방문자 수: {timeAnalytics && timeAnalytics.length > 0 ? 
                  Math.max(...timeAnalytics.map(item => item.visitors || 0)) : 0}명
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 5 && (
        <Grid container spacing={3}>
          {/* 접속 목적 전체 통계 */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🎯 전체 접속 목적 통계
              </Typography>
              {console.log('🎯 [AdminPage] 접속 목적 차트 렌더링 조건:', {
                accessPurposeAnalytics,
                isArray: Array.isArray(accessPurposeAnalytics),
                length: accessPurposeAnalytics?.length,
                condition: accessPurposeAnalytics && accessPurposeAnalytics.length > 0
              })}
              {accessPurposeAnalytics && accessPurposeAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} id="access-purpose-pie-chart">
                  <PieChart>
                    <Pie
                      data={accessPurposeAnalytics.map(item => ({
                        name: item.purpose,
                        value: item.count,
                        percentage: item.percentage
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {accessPurposeAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPurposeColor(entry.purpose, index)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}명 (${accessPurposeAnalytics.find(p => p.purpose === name)?.percentage}%)`, 
                        '방문자 수'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  <Typography variant="h6">
                    📭 접속 목적 데이터가 없습니다
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* 접속 목적 상세 리스트 */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 접속 목적 상세 분석
              </Typography>
              
              {accessPurposeAnalytics && accessPurposeAnalytics.length > 0 ? (
                <List>
                  {accessPurposeAnalytics.map((purpose, index) => (
                    <React.Fragment key={purpose.purpose}>
                      <ListItem sx={{ 
                        backgroundColor: purpose.purpose === 'Skipped' ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                        borderRadius: purpose.purpose === 'Skipped' ? 1 : 0,
                        border: purpose.purpose === 'Skipped' ? '1px solid rgba(255, 107, 107, 0.3)' : 'none'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              minWidth: 40, 
                              color: purpose.purpose === 'Skipped' ? '#ff6b6b' : (index < 3 ? '#ff6b35' : 'text.secondary'),
                              fontWeight: purpose.purpose === 'Skipped' ? 'bold' : (index < 3 ? 'bold' : 'normal')
                            }}
                          >
                            {purpose.purpose === 'Skipped' ? '⏭️' : `#${index + 1}`}
                          </Typography>
                          <Box sx={{ flexGrow: 1, ml: 2 }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="medium"
                              sx={{ 
                                color: purpose.purpose === 'Skipped' ? '#ff6b6b' : 'inherit'
                              }}
                            >
                              {purpose.purpose === 'Skipped' ? '목적 선택 건너뜀 (Skip)' : purpose.purpose}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={`${purpose.count}명`} 
                                size="small" 
                                color={purpose.purpose === 'Skipped' ? 'error' : 'primary'}
                              />
                              <Chip 
                                label={`${purpose.percentage}%`} 
                                size="small" 
                                color={purpose.purpose === 'Skipped' ? 'error' : 'secondary'}
                                variant={purpose.purpose === 'Skipped' ? 'filled' : 'outlined'}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < accessPurposeAnalytics.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  접속 목적 데이터가 없습니다. 사용자가 접속 목적을 선택하면 여기에 표시됩니다.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 6 && (
        <Grid container spacing={3}>
          {/* 사용자 관리 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  👥 사용자 관리
                </Typography>
                <Button
                  variant="outlined"
                  onClick={fetchCognitoUsers}
                  disabled={loadingUsers}
                  startIcon={loadingUsers ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  {loadingUsers ? '로딩 중...' : '새로고침'}
                </Button>
              </Box>
              
              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : users.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>사용자명</TableCell>
                        <TableCell>이메일</TableCell>
                        <TableCell>회사명</TableCell>
                        <TableCell>가입 목적</TableCell>
                        <TableCell>역할</TableCell>
                        <TableCell>그룹</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell>가입일</TableCell>
                        <TableCell>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.company || '미입력'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getPurposeDisplayName(user.purpose)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getRoleDisplayName(user.role)} 
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.groups.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {user.groups.map(group => (
                                <Chip 
                                  key={group}
                                  label={group} 
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              그룹 없음
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status} 
                            color={user.status === 'CONFIRMED' ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.createdAt}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role); // 현재 역할을 기본값으로 설정
                                setRoleChangeDialog(true);
                              }}
                            >
                              역할 변경
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => {
                                setUserToResetPassword(user);
                                setPasswordResetDialog(true);
                              }}
                            >
                              비밀번호 초기화
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteConfirmDialog(true);
                              }}
                              disabled={user.role === 'Admin'} // 관리자는 삭제 불가
                            >
                              삭제
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              ) : (
                <Alert severity="info">
                  등록된 사용자가 없습니다. 새로고침 버튼을 클릭하여 사용자 목록을 다시 불러오세요.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* 역할 변경 다이얼로그 */}
      <Dialog open={roleChangeDialog} onClose={() => setRoleChangeDialog(false)}>
        <DialogTitle>사용자 역할 변경</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {selectedUser?.name}님의 역할을 변경하시겠습니까?
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>새 역할</InputLabel>
            <Select
              value={newRole}
              label="새 역할"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value={USER_ROLES.ADMIN}>관리자 (Admin)</MenuItem>
              <MenuItem value={USER_ROLES.CONTENT_MANAGER}>콘텐츠 관리자 (Content Manager)</MenuItem>
              <MenuItem value={USER_ROLES.CONTRIBUTOR}>컨텐츠 업로더 (Contributor)</MenuItem>
              <MenuItem value={USER_ROLES.VIEWER}>일반 사용자 (Viewer)</MenuItem>
            </Select>
          </FormControl>
          
          {/* 권한 설명 */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>권한 설명:</strong><br/>
              • <strong>관리자</strong>: 모든 기능 접근 + 사용자 관리<br/>
              • <strong>콘텐츠 관리자</strong>: 모든 콘텐츠 관리 + 생성<br/>
              • <strong>컨텐츠 업로더</strong>: 콘텐츠 생성 및 업로드<br/>
              • <strong>일반 사용자</strong>: 콘텐츠 조회만 가능
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleChangeDialog(false)}>취소</Button>
          <Button onClick={handleRoleChange} variant="contained">변경</Button>
        </DialogActions>
      </Dialog>

      {/* 비밀번호 초기화 확인 다이얼로그 */}
      <Dialog 
        open={passwordResetDialog} 
        onClose={() => setPasswordResetDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main' }}>
          🔑 비밀번호 초기화
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>주의:</strong> 사용자의 현재 비밀번호가 임시 비밀번호로 변경됩니다!
          </Alert>
          
          {userToResetPassword && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                다음 사용자의 비밀번호를 초기화하시겠습니까?
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2"><strong>사용자명:</strong> {userToResetPassword.name}</Typography>
                <Typography variant="body2"><strong>이메일:</strong> {userToResetPassword.email}</Typography>
                <Typography variant="body2"><strong>역할:</strong> {getRoleDisplayName(userToResetPassword.role)}</Typography>
              </Paper>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                • 임시 비밀번호가 사용자의 이메일로 자동 발송됩니다<br/>
                • 사용자는 이메일을 확인하여 임시 비밀번호를 받습니다<br/>
                • 임시 비밀번호로 로그인 후 새 비밀번호 설정이 필요합니다<br/>
                • 이메일이 스팸 폴더에 있을 수 있으니 사용자에게 안내하세요
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setPasswordResetDialog(false);
              setUserToResetPassword(null);
            }}
          >
            취소
          </Button>
          <Button 
            onClick={async () => {
              if (userToResetPassword) {
                await resetUserPassword(userToResetPassword.username, userToResetPassword.email);
                setPasswordResetDialog(false);
                setUserToResetPassword(null);
              }
            }}
            variant="contained"
            color="warning"
          >
            비밀번호 초기화
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 삭제 확인 다이얼로그 */}
      <Dialog 
        open={deleteConfirmDialog} 
        onClose={() => setDeleteConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          ⚠️ 사용자 계정 삭제
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>주의:</strong> 이 작업은 되돌릴 수 없습니다!
          </Alert>
          
          {userToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                다음 사용자 계정을 영구적으로 삭제하시겠습니까?
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2"><strong>사용자명:</strong> {userToDelete.name}</Typography>
                <Typography variant="body2"><strong>이메일:</strong> {userToDelete.email}</Typography>
                <Typography variant="body2"><strong>역할:</strong> {getRoleDisplayName(userToDelete.role)}</Typography>
                <Typography variant="body2"><strong>가입일:</strong> {userToDelete.createdAt}</Typography>
              </Paper>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                • 사용자 계정이 완전히 삭제됩니다<br/>
                • 해당 사용자가 작성한 콘텐츠는 유지됩니다<br/>
                • 삭제된 계정은 복구할 수 없습니다
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmDialog(false);
              setUserToDelete(null);
            }}
          >
            취소
          </Button>
          <Button 
            onClick={async () => {
              if (userToDelete) {
                await deleteUser(userToDelete.username);
                setDeleteConfirmDialog(false);
                setUserToDelete(null);
              }
            }}
            variant="contained"
            color="error"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;
