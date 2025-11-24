import React, { useState, useEffect,useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '../ui/dialog';
import {
  Clock, Trophy, Target, Award, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function MockTests() {
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [continueTest, setContinueTest] = useState<any | null>(null);

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [ongoingTests, setOngoingTests] = useState<any[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const API_URL = "https://ebook-backend-lxce.onrender.com/api/mock-tests";

  // ----- refreshAll (reusable) -----
  const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("supabase_token") ||
  null;

const refreshAll = useCallback(async () => {
  try {
    const token = getToken();
    console.log("TOKEN USED:", token);
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
console.log("Requesting APIs...");

    const [
      availableRes,
      ongoingRes,
      completedRes,
      statsRes,
      leaderboardRes
    ] = await Promise.all([
      axios.get(`${API_URL}`, { headers }),
      axios.get(`${API_URL}/ongoing`, { headers }),
      axios.get(`${API_URL}/completed`, { headers }),
      axios.get(`${API_URL}/stats`, { headers }),
      axios.get(`${API_URL}/leaderboard`, { headers })
    ]);

    // AVAILABLE
    setAvailableTests(
      (availableRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        subject: t.subject,
        questions: t.total_questions,
        duration: `${t.duration_minutes} mins`,
        difficulty: t.difficulty,
        participants: t.participants ?? 0
      }))
    );

    // ONGOING
    setOngoingTests(
      (ongoingRes.data || []).map((t: any) => ({
        attemptId: t.id,
        testId: t.test_id,
        title: t.mock_tests?.title,
        subject: t.mock_tests?.subject,
        questions: t.mock_tests?.total_questions,
        completed: t.completed_questions,
        duration: `${t.mock_tests?.duration_minutes} mins`,
        difficulty: t.mock_tests?.difficulty
      }))
    );

    // COMPLETED
    setCompletedTests(
      (completedRes.data || []).map((t: any) => ({
        attemptId: t.id,
        title: t.mock_tests?.title,
        subject: t.mock_tests?.subject,
        score: t.score,
        rank: t.rank,
        participants: t.mock_tests?.participants ?? 100,
        maxScore: 100,
        date: t.completed_at
      }))
    );

    // STATS
    const s = {
      tests_taken: statsRes.data?.tests_taken ?? 0,
      average_score: statsRes.data?.average_score ?? 0,
      best_rank: statsRes.data?.best_rank ?? null,
      total_study_time: statsRes.data?.total_study_time ?? 0
    };

    setStats([
      { label: "Tests Taken", value: s.tests_taken, icon: Target, color: "bg-blue-500" },
      { label: "Average Score", value: `${s.average_score}%`, icon: Trophy, color: "bg-green-500" },
      { label: "Best Rank", value: s.best_rank ? `#${s.best_rank}` : "—", icon: Award, color: "bg-yellow-500" },
      { label: "Study Time", value: `${s.total_study_time} min`, icon: Clock, color: "bg-purple-500" }
    ]);

    // LEADERBOARD
  setLeaderboard(
  (leaderboardRes.data || []).map((u: any, index: number) => ({
    rank: index + 1,
    name: u.display_name || `User ${index + 1}`,
    score: u.score ?? 0,   // backend now returns `score`
    tests: 1,              // you can update this later
    badge:
      index === 0 ? "🥇" :
      index === 1 ? "🥈" :
      index === 2 ? "🥉" : "",
    highlight:
      u.user_id === JSON.parse(localStorage.getItem("user") || "{}").id
  }))
);


  } catch (err) {
    console.error("❌ Fetching error:", err);
    toast.error("Failed to load mock tests");
  }
}, []);

  // ----- initial load -----
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ----- Listen for a finished-test flag set by TestPage -----
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "test_finished" && e.newValue === "yes") {
        localStorage.removeItem("test_finished");
        refreshAll();
      }
    };
    window.addEventListener("storage", onStorage);

    // also polling fallback in case new tab/window doesn't fire storage
    const t = setInterval(() => {
      const finished = localStorage.getItem("test_finished");
      if (finished === "yes") {
        localStorage.removeItem("test_finished");
        refreshAll();
      }
    }, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, [refreshAll]);

  // START TEST
  const handleStartClick = async (test: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/start`,
        { test_id: test.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const attempt = res.data.attempt;
      localStorage.setItem("active_test_id", String(test.id));
      localStorage.setItem("active_attempt_id", String(attempt.id));
      window.open(`/test/${test.id}`, "_blank");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start test");
    }
  };

  // CONTINUE TEST
  const handleGoToOngoingTest = () => {
    if (!continueTest) return;
   window.location.href = `/test/${continueTest.testId}`;

    setContinueTest(null);
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Mock Tests & Assessments</h2>
        <p className="text-sm text-gray-500">
          Test your knowledge and track your progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-[#1d4d6a]">{stat.value}</h3>
                </div>
                <div className="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center">
                  <stat.icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing ({ongoingTests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Available Tests */}
        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableTests.map((test: any) => (
              <Card key={test.id} className="border-none shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-[#1d4d6a]">{test.title}</CardTitle>
                    <Badge
                      className={
                        test.difficulty === "Easy"
                          ? "bg-green-100 text-green-700"
                          : test.difficulty === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {test.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{test.subject}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>{test.questions} Questions</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {test.participants.toLocaleString()} students participated
                  </div>

                  <Button
                    className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
                    onClick={() => handleStartClick(test)}
                  >
                    Start Test
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ongoing Tests */}
        <TabsContent value="ongoing" className="mt-6">
          <div className="space-y-4">
            {ongoingTests.map((test: any) => (
              <Card key={test.attemptId} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[#1d4d6a] mb-1">{test.title}</h3>
                      <p className="text-sm text-gray-500">{test.subject}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {test.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        Progress: {test.completed} / {test.questions}
                      </span>
                      <span>
                        {Math.round((test.completed / test.questions) * 100)}%
                      </span>
                    </div>

                    <Progress
                      value={(test.completed / test.questions) * 100}
                      className="h-2"
                    />

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Time: {test.duration}</span>
                      </div>

                      <Button
                        className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
                        onClick={() => setContinueTest(test)}
                      >
                        Continue Test <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Tests */}
        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedTests.map((test: any) => (
              <Card key={test.attemptId} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[#1d4d6a] mb-1">{test.title}</h3>
                      <p className="text-sm text-gray-500">
                        {test.subject} • {new Date(test.date).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge className={
                      test.score >= 90
                        ? "bg-green-100 text-green-700"
                        : test.score >= 75
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }>
                      {test.score >= 90 ? "Excellent" : test.score >= 75 ? "Good" : "Pass"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Score</p>
                      <p className="text-[#1d4d6a]">{test.score}/{test.maxScore}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Rank</p>
                      <p className="text-[#1d4d6a] flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />#{test.rank}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Percentile</p>
                      <p className="text-[#1d4d6a]">
                        {Math.round((1 - test.rank / test.participants) * 100)}th
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Top Performers</CardTitle>
              <CardDescription>See how you rank</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user: any) => (
  <div
    key={user.user_id}   // 🔥 UNIQUE KEY
    className={`flex items-center justify-between p-4 rounded-lg ${
      user.highlight
        ? "bg-[#bf2026] bg-opacity-10 border-2 border-[#bf2026]"
        : "bg-gray-50"
    }`}
  >

                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          user.highlight ? "bg-[#bf2026]" : "bg-[#1d4d6a]"
                        }`}
                      >
                        {user.badge || user.rank}
                      </div>
                      <div>
                        <p className={user.highlight ? "text-[#bf2026]" : "text-[#1d4d6a]"}>
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.tests} tests</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={user.highlight ? "text-[#bf2026]" : "text-[#1d4d6a]"}>
                        {user.score}%
                      </p>
                      <p className="text-xs text-gray-500">Avg. Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Continue Test Modal */}
      <Dialog open={!!continueTest} onOpenChange={() => setContinueTest(null)}>
        <DialogContent className="max-w-md">
          {continueTest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1d4d6a]">
                  Continue {continueTest.title}
                </DialogTitle>
                <DialogDescription>
                  You have an unfinished test. Continue now?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2 text-sm text-gray-700">
                <p><b>📚 Subject:</b> {continueTest.subject}</p>
                <p><b>📝 Progress:</b> {continueTest.completed}/{continueTest.questions}</p>
                <p><b>🕒 Duration:</b> {continueTest.duration}</p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button className="bg-gray-200 text-gray-700" onClick={() => setContinueTest(null)}>Cancel</Button>
                <Button
                  className="bg-[#bf2026] text-white"
                  onClick={handleGoToOngoingTest}
                >
                  Resume Test
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}