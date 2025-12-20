import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Clock, Trophy, Target, Award, ChevronRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export function MockTests() {
  const [continueTest, setContinueTest] = useState<any | null>(null);
  const [loading, setLoading] = useState({
    initial: true,
    stats: true,
    available: true,
    ongoing: true,
    completed: true,
    leaderboard: true,
    starting: false,
  });

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [ongoingTests, setOngoingTests] = useState<any[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const API_URL = "https://ebook-backend-lxce.onrender.com/api/mock-tests";
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  /*=====================================================
    FETCH DATA
  =====================================================*/
  const refreshAll = useCallback(async () => {
    setLoading(prev => ({
      ...prev,
      stats: true,
      available: true,
      ongoing: true,
      completed: true,
      leaderboard: true,
    }));

    try {
      const [availableRes, ongoingRes, completedRes, statsRes, leaderboardRes] =
        await Promise.all([
          axios.get(API_URL, { headers }),
          axios.get(`${API_URL}/ongoing`, { headers }),
          axios.get(`${API_URL}/completed`, { headers }),
          axios.get(`${API_URL}/stats`, { headers }),
          axios.get(`${API_URL}/leaderboard`, { headers }),
        ]);

      const now = new Date();
      const tests = Array.isArray(availableRes.data) ? availableRes.data : [];

      /*---------------------
        AVAILABLE TESTS
      ----------------------*/
      setAvailableTests(
        tests.map((t: any) => {
          const start = t.start_time ? new Date(t.start_time) : null;
          return {
            id: t.id,
            title: t.title,
            subject: t.subject,
            questions: t.total_questions,
            duration_minutes: t.duration_minutes,
            duration: `${t.duration_minutes} mins`,
            difficulty: t.difficulty,
            participants: new Set(
              (t.mock_attempts || []).map((a: any) => a.user_id)
            ).size,
            start_time: t.start_time,
            isFuture: start ? start > now : false,
          };
        })
      );
      setLoading(prev => ({ ...prev, available: false }));

      /*---------------------
        ONGOING TESTS
      ----------------------*/
      setOngoingTests(
        (ongoingRes.data || []).map((t: any) => ({
          attemptId: t.id,
          testId: t.test_id,
          title: t.mock_tests?.title || "",
          subject: t.mock_tests?.subject || "",
          questions: t.mock_tests?.total_questions || 0,
          completed: t.completed_questions || 0,
          duration: `${t.mock_tests?.duration_minutes || 0} mins`,
          difficulty: t.mock_tests?.difficulty || "",
        }))
      );
      setLoading(prev => ({ ...prev, ongoing: false }));

      /*---------------------
        COMPLETED TESTS
      ----------------------*/
      setCompletedTests(
        (completedRes.data || []).map((t: any) => ({
          attemptId: t.id,
          title: t.mock_tests?.title || "",
          subject: t.mock_tests?.subject || "",
          score: t.score || 0,
          rank: typeof t.rank === "number" ? t.rank : null,
          percentile: typeof t.percentile === "number" ? t.percentile : null,
          participants: t.mock_tests?.participants || 1,
          maxScore: 100,
          date: t.completed_at,
        }))
      );
      setLoading(prev => ({ ...prev, completed: false }));

      /*---------------------
        STATS
      ----------------------*/
      const s = statsRes.data || {};
      setStats([
        {
          label: "Tests Taken",
          value: s.tests_taken || 0,
          icon: Target,
          color: "bg-blue-500",
        },
        {
          label: "Average Score",
          value: `${s.average_score || 0}%`,
          icon: Trophy,
          color: "bg-green-500",
        },
        {
          label: "Best Rank",
          value: s.best_rank ? `#${s.best_rank}` : "—",
          icon: Award,
          color: "bg-yellow-500",
        },
        {
          label: "Study Time",
          value: `${s.total_study_time || 0} min`,
          icon: Clock,
          color: "bg-purple-500",
        },
      ]);
      setLoading(prev => ({ ...prev, stats: false }));

      /*---------------------
        LEADERBOARD
      ----------------------*/
      const user = JSON.parse(localStorage.getItem("user") || "{}") || null;
      const userId = user?.id;

      setLeaderboard(
        (leaderboardRes.data || []).map((u: any, idx: number) => ({
          rank: idx + 1,
          name: u.display_name || "User",
          score: u.average_score || 0,
          tests: u.tests_taken || 0,
          badge: idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "",
          highlight: u.user_id === userId,
        }))
      );
      setLoading(prev => ({ ...prev, leaderboard: false, initial: false }));

    } catch (err: any) {
      console.error("Error loading mock tests:", err);
      toast.error(err.response?.data?.error || "Failed to load mock tests");
      
      // Reset loading states on error
      setLoading({
        initial: false,
        stats: false,
        available: false,
        ongoing: false,
        completed: false,
        leaderboard: false,
        starting: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /*=====================================================
    STORAGE SYNC FOR MULTI-TAB
  =====================================================*/
  useEffect(() => {
    const listener = (e: any) => {
      if (e.key === "test_finished") {
        localStorage.removeItem("test_finished");
        refreshAll();
      }
    };

    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  /*=====================================================
    START TEST
  =====================================================*/
  const handleStart = async (test: any) => {
    setLoading(prev => ({ ...prev, starting: true }));
    try {
      const res = await axios.post(
        `${API_URL}/start`,
        { test_id: test.id },
        { headers }
      );

      const attempt = res.data.attempt;
      if (attempt?.id) {
        localStorage.setItem("active_attempt_id", attempt.id);
        window.location.href = `/test/${test.id}`;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start test");
    } finally {
      setLoading(prev => ({ ...prev, starting: false }));
    }
  };

  /*=====================================================
    RESUME TEST
  =====================================================*/
  const handleResume = () => {
    if (!continueTest) return;
    localStorage.setItem("active_attempt_id", continueTest.attemptId);
    window.location.href = `/test/${continueTest.testId}`;
    setContinueTest(null);
  };

  /*=====================================================
    RENDER LOADING SPINNER
  =====================================================*/
  const renderSpinner = (text: string = "Loading...") => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  /*=====================================================
    UI
  =====================================================*/
  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/*---------------------------------------------------
        HEADER
      -----------------------------------------------------*/}
      <div className="px-1">
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">
          Mock Tests & Assessments
        </h2>
        <p className="text-sm text-gray-500">
          Test your knowledge and track your progress
        </p>
      </div>

      {/* SHOW INITIAL LOADING */}
      {loading.initial ? (
        renderSpinner("Loading mock tests...")
      ) : (
        <>
          {/*---------------------------------------------------
            STATS - Responsive grid
          -----------------------------------------------------*/}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-none shadow-md">
                <CardContent className="p-4 sm:p-6">
                  {loading.stats ? (
                    <div className="flex items-center justify-center h-16">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#1d4d6a]"></div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.label}</p>
                        <h3 className="text-[#1d4d6a] text-lg sm:text-xl font-semibold">{stat.value}</h3>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ml-2">
                        <stat.icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color.replace("bg-", "text-")}`}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/*---------------------------------------------------
            TABS - Responsive tabs
          -----------------------------------------------------*/}
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="bg-white border border-gray-200 w-full flex overflow-x-auto">
              <TabsTrigger value="available" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
                Available Tests
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
                Ongoing ({ongoingTests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
                Completed
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
                Leaderboard
              </TabsTrigger>
            </TabsList>

            {/*---------------------------------------------------
              AVAILABLE TESTS - Responsive grid
            -----------------------------------------------------*/}
            <TabsContent value="available" className="mt-4 sm:mt-6">
              {loading.available ? (
                renderSpinner("Loading available tests...")
              ) : availableTests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No available tests at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {availableTests.map((test: any) => (
                    <Card
                      key={test.id}
                      className="border-none shadow-md hover:shadow-lg transition-all"
                    >
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-[#1d4d6a] text-base sm:text-lg">
                            {test.title}
                          </CardTitle>
                          <Badge
                            className={`text-xs ${
                              test.difficulty === "Easy"
                                ? "bg-green-100 text-green-700"
                                : test.difficulty === "Medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {test.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">{test.subject}</CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">{test.questions} Questions</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">{test.duration}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          <p className="text-[#1d4d6a]">
                            {test.participants} Participants
                          </p>
                        </div>

                        <Button
                          className={`w-full text-white text-sm sm:text-base py-2 flex items-center justify-center gap-2 ${
                            test.isFuture
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#bf2026] hover:bg-[#a01c22]"
                          }`}
                          disabled={test.isFuture || loading.starting}
                          onClick={() => !test.isFuture && handleStart(test)}
                        >
                          {loading.starting ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Starting...
                            </>
                          ) : test.isFuture ? (
                            `Starts at ${new Date(test.start_time).toLocaleDateString()}`
                          ) : (
                            "Start Test"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/*---------------------------------------------------
              ONGOING TESTS - Responsive layout
            -----------------------------------------------------*/}
            <TabsContent value="ongoing" className="mt-4 sm:mt-6">
              {loading.ongoing ? (
                renderSpinner("Loading ongoing tests...")
              ) : ongoingTests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No ongoing tests. Start a test to see it here!
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {ongoingTests.map((test: any) => (
                    <Card key={test.attemptId} className="border-none shadow-md">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-[#1d4d6a] text-base sm:text-lg font-semibold mb-1">{test.title}</h3>
                            <p className="text-sm text-gray-500">{test.subject}</p>
                          </div>

                          <Badge className="bg-blue-100 text-blue-700 text-xs sm:text-sm w-fit">
                            {test.completed}/{test.questions}
                          </Badge>
                        </div>

                        <Progress
                          value={(test.completed / test.questions) * 100}
                          className="h-1.5 sm:h-2 rounded-full"
                        />

                        <div className="flex justify-end mt-3 sm:mt-4">
                          <Button
                            className="bg-[#bf2026] text-white text-sm sm:text-base py-2 px-4 hover:bg-[#a01c22] transition"
                            onClick={() => {
                              setContinueTest(test);
                            }}
                          >
                            Resume
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/*---------------------------------------------------
              COMPLETED TESTS - Responsive layout
            -----------------------------------------------------*/}
            <TabsContent value="completed" className="mt-4 sm:mt-6">
              {loading.completed ? (
                renderSpinner("Loading completed tests...")
              ) : completedTests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No completed tests yet. Complete a test to see your results!
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {completedTests.map((test: any) => (
                    <Card key={test.attemptId} className="border-none shadow-md">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-[#1d4d6a] text-base sm:text-lg font-semibold mb-1">{test.title}</h3>
                            <p className="text-sm text-gray-500">
                              {test.subject} • {new Date(test.date).toLocaleDateString()}
                            </p>
                          </div>

                          <Badge
                            className={`text-xs sm:text-sm w-fit ${
                              test.score >= 90
                                ? "bg-green-100 text-green-700"
                                : test.score >= 75
                                ? "bg-blue-100 text-blue-700"
                                : test.score >= 40
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {test.score >= 90
                              ? "Excellent"
                              : test.score >= 75
                              ? "Good"
                              : test.score >= 40
                              ? "Pass"
                              : "Fail"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Score</p>
                            <p className="text-[#1d4d6a] text-sm sm:text-base">
                              {test.score}/{test.maxScore}
                            </p>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Rank</p>
                            <p className="text-[#1d4d6a] text-sm sm:text-base flex items-center gap-1">
                              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                              {test.rank ? `#${test.rank}` : "N/A"}
                            </p>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Percentile</p>
                            <p className="text-[#1d4d6a] text-sm sm:text-base">
                              {test.percentile !== null ? `${test.percentile}th` : "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/*---------------------------------------------------
              LEADERBOARD - Responsive layout
            -----------------------------------------------------*/}
            <TabsContent value="leaderboard" className="mt-4 sm:mt-6">
              {loading.leaderboard ? (
                renderSpinner("Loading leaderboard...")
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No leaderboard data available.
                </div>
              ) : (
                <Card className="border-none shadow-md">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-[#1d4d6a] text-lg sm:text-xl">Top Performers</CardTitle>
                    <CardDescription className="text-sm">See how you rank</CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      {leaderboard.map((user: any) => (
                        <div
                          key={user.rank}
                          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                            user.highlight
                              ? "bg-[#fff5f5] border-[#bf2026]"
                              : "bg-gray-50 border-transparent" 
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base ${
                                user.highlight ? "bg-[#bf2026]" : "bg-[#1d4d6a]"
                              }`}
                            >
                              {user.badge || user.rank}
                            </div>
                            <div>
                              <p
                                className={`text-sm sm:text-base font-medium ${
                                  user.highlight ? "text-[#bf2026]" : "text-[#1d4d6a]"
                                }`}
                              >
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.tests} tests
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-sm sm:text-base font-medium ${
                                user.highlight ? "text-[#bf2026]" : "text-[#1d4d6a]"
                              }`}
                            >
                              {user.score}%
                            </p>
                            <p className="text-xs text-gray-500">Avg. Score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/*---------------------------------------------------
        CONTINUE TEST MODAL - Responsive dialog
      -----------------------------------------------------*/}
      <Dialog open={!!continueTest} onOpenChange={() => setContinueTest(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-auto">
          {continueTest && (
            <>
              <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <DialogTitle className="text-[#1d4d6a] text-lg sm:text-xl">
                  Continue {continueTest.title}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  You have an unfinished test. Continue now?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2 text-sm text-gray-700 px-4 sm:px-6">
                <p>
                  <b>📚 Subject:</b> {continueTest.subject}
                </p>
                <p>
                  <b>📝 Progress:</b> {continueTest.completed}/
                  {continueTest.questions}
                </p>
                <p>
                  <b>🕒 Duration:</b> {continueTest.duration}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
                <Button
                  className="bg-gray-200 text-gray-700 text-sm sm:text-base py-2 hover:bg-gray-300 transition"
                  onClick={() => setContinueTest(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#bf2026] text-white text-sm sm:text-base py-2 hover:bg-[#a01c22] transition flex items-center gap-2"
                  onClick={handleResume}
                >
                  Resume Test
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}