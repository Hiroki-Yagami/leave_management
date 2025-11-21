// 'use client'はNext.jsのApp Routerで、このコンポーネントがブラウザ側で動作することを示します
// サーバー側ではなく、クライアント側でReactの機能（useState, useEffectなど）を使えるようにします
'use client';

// Reactのフック（Hook）をインポート
// useState: 状態（データ）を管理するためのフック
// useEffect: コンポーネントが表示された時に処理を実行するフック
import { useState, useEffect } from 'react';
import { getDetailedLeaveStatus } from '@/lib/leaveService';

// TypeScript の型定義
// 従業員のデータ構造を定義（どんな情報を持っているか）
type Employee = {
  id: string;              // 従業員ID（一意の識別子）
  name: string;            // 名前
  hireDate: string;        // 入社日
  email: string | null;    // メールアドレス（nullの場合もある）
  remaining: number;       // 残りの有給日数
  totalGranted: number;    // 付与された合計日数
  totalUsed: number;       // 使用した合計日数
};

// 有給付与のデータ構造
type Grant = {
  id: string;
  grantDate: string;           // 付与日
  daysGranted: number;         // 付与日数
  expirationDate: string;      // 時効日（2年後）
  isExpired: boolean;          // 期限切れかどうか
  daysUntilExpiration: number; // 時効まであと何日か
  isExpiringSoon: boolean;     // もうすぐ時効か（30日以内）
};

// 有給取得記録のデータ構造
type LeaveRequest = {
  id: string;
  date: string;           // 取得日
  status: string;         // ステータス（APPROVED = 承認済み）
  reason: string | null;  // 理由
};

// 休職期間のデータ構造
type LeaveOfAbsence = {
  id: string;
  startDate: string;  // 開始日
  endDate: string;    // 終了日
  reason: string | null;
};

// メインのコンポーネント（画面全体を表示する関数）
export default function Home() {
  // === 状態管理（useState） ===
  // useStateは値を保存して、値が変わったら画面を自動的に更新してくれる
  
  // 従業員リストの状態（最初は空の配列[]）
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // ローディング中かどうか（最初はtrue = 読み込み中）
  const [loading, setLoading] = useState(true);
  
  // 新規従業員登録フォームの入力値
  const [newName, setNewName] = useState('');          // 名前
  const [newHireDate, setNewHireDate] = useState('');  // 入社日
  const [newEmail, setNewEmail] = useState('');        // メール
  
  // モーダル（ポップアップウィンドウ）の表示状態
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null); // 選択中の従業員ID
  const [showDetailModal, setShowDetailModal] = useState(false);  // 詳細モーダルを表示するか
  const [showEditModal, setShowEditModal] = useState(false);      // 編集モーダルを表示するか
  const [showLeaveModal, setShowLeaveModal] = useState(false);    // 有給取得モーダルを表示するか
  
  // 詳細モーダルに表示するデータ
  const [detailData, setDetailData] = useState<{
    grants: Grant[];                // 付与履歴
    leaveRequests: LeaveRequest[];  // 取得履歴
    expiringGrants: Grant[];        // もうすぐ時効になる付与
  } | null>(null);
  
  // 編集フォームの入力値
  const [editName, setEditName] = useState('');
  const [editHireDate, setEditHireDate] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  // 有給取得フォームの入力値
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  
  // 休職期間モーダルの状態
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [leaveOfAbsences, setLeaveOfAbsences] = useState<LeaveOfAbsence[]>([]);

  // === 関数定義 ===
  
  // サーバーから従業員リストを取得する関数（async = 非同期処理）
  const fetchEmployees = async () => {
    setLoading(true);  // ローディング開始
    try {
      // APIを呼び出してデータを取得
      const res = await fetch('/api/employees');
      const data = await res.json();  // JSONデータに変換
      setEmployees(data);  // 状態を更新（画面が自動的に再描画される）
    } catch (error) {
      // エラーが発生した場合
      console.error('Failed to fetch employees', error);
    } finally {
      // 成功・失敗に関わらず最後に実行
      setLoading(false);  // ローディング終了
    }
  };

  // useEffect: コンポーネントが最初に表示された時に1回だけ実行される
  // []は「依存配列」で、空の場合は初回のみ実行
  useEffect(() => {
    fetchEmployees();  // 従業員リストを取得
  }, []);

  // 新しい従業員を追加する関数
  // e: React.FormEvent はフォーム送信イベント
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();  // フォームのデフォルト動作（ページリロード）を防ぐ
    try {
      // POSTメソッドでAPIにデータを送信
      await fetch('/api/employees', {
        method: 'POST',  // 新規作成はPOSTメソッド
        headers: { 'Content-Type': 'application/json' },  // JSON形式で送信
        body: JSON.stringify({ name: newName, hireDate: newHireDate, email: newEmail }),  // データをJSON文字列に変換
      });
      // 入力フォームをクリア
      setNewName('');
      setNewHireDate('');
      setNewEmail('');
      fetchEmployees();  // リストを再取得して画面を更新
    } catch (error) {
      console.error('Failed to add employee', error);
    }
  };

  // 有給付与を再計算する関数（「再計算」ボタンを押した時）
  const handleGrantCheck = async (id: string) => {
    try {
      await fetch(`/api/employees/${id}/grant`, { method: 'POST' });
      fetchEmployees();  // リストを更新
    } catch (error) {
      console.error('Failed to check grants', error);
    }
  };

  // 従業員の詳細情報を表示する関数（「詳細」ボタンを押した時）
  const handleShowDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`);
      const data = await res.json();
      // 詳細モーダルに表示するデータをセット
      setDetailData({
        grants: data.grants || [],              // 付与履歴
        leaveRequests: data.leaveRequests || [], // 取得履歴
        expiringGrants: data.expiringGrants || [] // もうすぐ時効になる付与
      });
      setSelectedEmployee(id);  // 選択中の従業員IDを保存
      setShowDetailModal(true);  // 詳細モーダルを表示
    } catch (error) {
      console.error('Failed to fetch details', error);
    }
  };

  // 従業員情報を編集する関数（「編集」ボタンを押した時）
  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp.id);
    // 現在の値を編集フォームにセット
    setEditName(emp.name);
    setEditHireDate(emp.hireDate.split('T')[0]);  // 日付部分のみ取得
    setEditEmail(emp.email || '');
    setShowEditModal(true);  // 編集モーダルを表示
  };

  // 編集内容を保存する関数
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;  // 従業員が選択されていない場合は何もしない
    
    try {
      // PUTメソッドでデータを更新
      await fetch(`/api/employees/${selectedEmployee}`, {
        method: 'PUT',  // 更新はPUTメソッド
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, hireDate: editHireDate, email: editEmail }),
      });
      setShowEditModal(false);  // モーダルを閉じる
      fetchEmployees();  // リストを更新
    } catch (error) {
      console.error('Failed to update employee', error);
    }
  };

  // 従業員を削除する関数（「削除」ボタンを押した時）
  const handleDelete = async (id: string, name: string) => {
    // 確認ダイアログを表示（ユーザーが「OK」を押した場合のみ削除）
    if (!confirm(`本当に ${name} を削除しますか？`)) return;
    
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });  // DELETEメソッドで削除
      fetchEmployees();  // リストを更新
    } catch (error) {
      console.error('Failed to delete employee', error);
    }
  };

  // 有給取得モーダルを開く関数（「取得」ボタンを押した時）
  const handleTakeLeave = (id: string) => {
    setSelectedEmployee(id);
    setLeaveDate('');
    setLeaveReason('');
    setShowLeaveModal(true);  // 有給取得モーダルを表示
  };

  // 有給取得を記録する関数
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee, date: leaveDate, reason: leaveReason }),
      });
      setShowLeaveModal(false);  // モーダルを閉じる
      fetchEmployees();  // リストを更新
      
      // 詳細モーダルが開いている場合は、そちらも更新
      if (showDetailModal) {
        await handleShowDetail(selectedEmployee);
      }
    } catch (error) {
      console.error('Failed to record leave', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">有給管理システム</h1>
          <p className="text-gray-600">Paid Leave Management System - 労働基準法準拠</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Add Employee Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
            <h2 className="text-xl font-semibold mb-4 text-indigo-800">新規従業員登録</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入社日</label>
                <input
                  type="date"
                  required
                  value={newHireDate}
                  onChange={(e) => setNewHireDate(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メール (任意)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                登録
              </button>
            </form>
          </div>

          {/* Employee List */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-indigo-800">従業員一覧</h2>
              <button
                onClick={fetchEmployees}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                🔄 更新
              </button>
            </div>
            
            {loading ? (
              <p className="text-gray-500">読み込み中...</p>
            ) : employees.length === 0 ? (
              <p className="text-gray-500">従業員が登録されていません。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">名前</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">入社日</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">残日数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(emp.hireDate).toLocaleDateString('ja-JP')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-indigo-600">{emp.remaining}</span>
                          <span className="text-xs text-gray-500 ml-1">/ {emp.totalGranted} 日</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleShowDetail(emp.id)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            詳細
                          </button>
                          <button
                            onClick={() => handleEdit(emp)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleTakeLeave(emp.id)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            取得
                          </button>
                          <button
                            onClick={() => handleGrantCheck(emp.id)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            再計算
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-indigo-900">有給詳細</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            {detailData.expiringGrants.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-yellow-800 font-semibold">⚠️ 時効が近い有給があります ({detailData.expiringGrants.length}件)</p>
              </div>
            )}
            
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-2 text-indigo-800">付与履歴</h4>
              <div className="space-y-2">
                {detailData.grants.map((grant) => (
                  <div key={grant.id} className={`p-3 rounded-lg border ${grant.isExpired ? 'bg-gray-100 border-gray-300' : grant.isExpiringSoon ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{new Date(grant.grantDate).toLocaleDateString('ja-JP')}</span>
                        <span className="ml-2 text-sm text-gray-600">付与: {grant.daysGranted}日</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          時効: {new Date(grant.expirationDate).toLocaleDateString('ja-JP')}
                        </div>
                        {grant.isExpired && <span className="text-xs text-red-600 font-semibold">期限切れ</span>}
                        {grant.isExpiringSoon && !grant.isExpired && (
                          <span className="text-xs text-yellow-600 font-semibold">あと{grant.daysUntilExpiration}日</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-2 text-indigo-800">取得履歴</h4>
              {detailData.leaveRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">取得履歴がありません</p>
              ) : (
                <div className="space-y-2">
                  {detailData.leaveRequests.map((req) => (
                    <div key={req.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between">
                        <span className="font-medium">{new Date(req.date).toLocaleDateString('ja-JP')}</span>
                        <span className="text-sm text-gray-600">{req.reason || '理由なし'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-indigo-900">従業員編集</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入社日</label>
                <input
                  type="date"
                  required
                  value={editHireDate}
                  onChange={(e) => setEditHireDate(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メール</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-indigo-900">有給取得記録</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">取得日</label>
                <input
                  type="date"
                  required
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">理由 (任意)</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  記録
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
