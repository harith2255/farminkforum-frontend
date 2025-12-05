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

  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [ongoingTests, setOngoingTests] = useState<any[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const API_URL = "https://ebook-backend-lxce.onrender.com/api/mock-tests";

const token = localStorage.getItem("token");

const headers = token
  ? { Authorization: `Bearer ${token}` }
  : {};


  /*=====================================================
    FETCH DATA
  =====================================================*/
  const refreshAll = useCallback(async () => {
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
            participants: t.participants || 0,
            start_time: t.start_time,
            isFuture: start ? start > now : false,
          };
        })
      );

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
          participants: t.mock_tests?.participants || 1,
          maxScore: 100,
          date: t.completed_at,
        }))
      );

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
    } catch (err) {
      console.log(err);
      toast.error("Failed to load mock tests");
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
    UI
  =====================================================*/
  return (
    <div className="space-y-6">
      {/*---------------------------------------------------
        HEADER
      -----------------------------------------------------*/}
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Mock Tests & Assessments</h2>
        <p className="text-sm text-gray-500">
          Test your knowledge and track your progress
        </p>
      </div>

      {/*---------------------------------------------------
        STATS
      -----------------------------------------------------*/}
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
                  <stat.icon
                    className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/*---------------------------------------------------
        TABS
      -----------------------------------------------------*/}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="ongoing">
            Ongoing ({ongoingTests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/*---------------------------------------------------
          AVAILABLE TESTS
        -----------------------------------------------------*/}
       <TabsContent value="available" className="mt-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {availableTests.map((test: any) => (
      <Card
        key={test.id}
        className="border-none shadow-md hover:shadow-lg transition-all"
      >
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="text-[#1d4d6a]">
              {test.title}
            </CardTitle>
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

          {/* REMOVE percentile completely here because it does not exist */}
          <div className="text-xs text-gray-500">
            <p className="text-[#1d4d6a]">
              {test.participants} Participants
            </p>
          </div>

          <Button
            className={`w-full text-white ${
              test.isFuture
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#bf2026] hover:bg-[#a01c22]"
            }`}
            disabled={test.isFuture}
            onClick={() => !test.isFuture && handleStart(test)}
          >
            {test.isFuture
              ? `Starts at ${new Date(
                  test.start_time
                ).toLocaleString()}`
              : "Start Test"}
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
</TabsContent>


        {/*---------------------------------------------------
          ONGOING TESTS
        -----------------------------------------------------*/}
      <TabsContent value="ongoing" className="mt-6">
  <div className="space-y-4">
    {ongoingTests.map((test: any) => (
      <Card key={test.attemptId} className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[#1d4d6a] mb-1">{test.title}</h3>
              <p className="text-sm text-gray-500">{test.subject}</p>
            </div>

            <Badge className="bg-blue-100 text-blue-700">
              {test.completed}/{test.questions}
            </Badge>
          </div>

          <Progress
            value={(test.completed / test.questions) * 100}
            className="h-2 rounded-full"
          />

          <div className="flex justify-end mt-4">
            <Button
              className="bg-[#bf2026] text-white"
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
</TabsContent>



        {/*---------------------------------------------------
          COMPLETED TESTS
        -----------------------------------------------------*/}
        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedTests.map((test: any) => (
              <Card key={test.attemptId} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[#1d4d6a] mb-1">{test.title}</h3>
                      <p className="text-sm text-gray-500">
                        {test.subject} •{" "}
                        {new Date(test.date).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge
                      className={
                        test.score >= 90
                          ? "bg-green-100 text-green-700"
                          : test.score >= 75
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }
                    >
                      {test.score >= 90
                        ? "Excellent"
                        : test.score >= 75
                        ? "Good"
                        : "Pass"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Score</p>
                      <p className="text-[#1d4d6a]">
                        {test.score}/{test.maxScore}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Rank</p>
                      <p className="text-[#1d4d6a] flex items-center gap-1">
  <Trophy className="w-4 h-4 text-yellow-500" />
  {test.rank ? `#${test.rank}` : "N/A"}
</p>

                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Percentile</p>
                      <p className="text-[#1d4d6a]">
                        {Math.round((1 - test.rank / test.participants) * 100)}
                        th
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/*---------------------------------------------------
          LEADERBOARD
        -----------------------------------------------------*/}
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
                    key={user.rank}
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
                        <p
                          className={
                            user.highlight
                              ? "text-[#bf2026]"
                              : "text-[#1d4d6a]"
                          }
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
                        className={
                          user.highlight
                            ? "text-[#bf2026]"
                            : "text-[#1d4d6a]"
                        }
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
        </TabsContent>
      </Tabs>

      {/*---------------------------------------------------
        CONTINUE TEST MODAL
      -----------------------------------------------------*/}
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

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  className="bg-gray-200 text-gray-700"
                  onClick={() => setContinueTest(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#bf2026] text-white"
                  onClick={handleResume}
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