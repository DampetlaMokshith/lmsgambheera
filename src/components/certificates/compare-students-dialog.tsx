'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, CheckCircle, XCircle } from 'lucide-react';

interface StudentComparison {
  id: string;
  name: string;
  email: string;
  progressPercentage: number;
  badgesCount: number;
  avatar?: string;
  isCurrentUser?: boolean;
  certificateIssued: boolean;
}

interface CompareStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  students: StudentComparison[];
  loading?: boolean;
}

export default function CompareStudentsDialog({
  open,
  onOpenChange,
  courseName,
  students,
  loading = false,
}: CompareStudentsDialogProps) {
  // Sort students by progress percentage (descending)
  const sortedStudents = [...students].sort(
    (a, b) => b.progressPercentage - a.progressPercentage
  );

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-black border max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg md:text-2xl">Course Leaderboard</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Compare your progress with other students in {courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 md:mt-6">
          {loading ? (
            // Loading skeleton
            <>
              <div className="block md:hidden pb-2">
                <p className="text-xs text-gray-400 text-center">
                  ← Loading student data... →
                </p>
              </div>
              <div className="border bg-black overflow-x-auto md:overflow-visible">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm w-16">Rank</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Name</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Email</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Progress</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Badges</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Certificate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i} className="border-gray-700 animate-pulse">
                        <TableCell><div className="h-5 w-5 bg-accent rounded mx-auto"></div></TableCell>
                        <TableCell><div className="h-4 bg-accent rounded w-32"></div></TableCell>
                        <TableCell><div className="h-4 bg-accent rounded w-40"></div></TableCell>
                        <TableCell><div className="h-4 bg-accent rounded w-24"></div></TableCell>
                        <TableCell><div className="h-4 bg-accent rounded w-12"></div></TableCell>
                        <TableCell><div className="h-4 bg-accent rounded w-20"></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : sortedStudents.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No student data available</p>
            </div>
          ) : (
            <>
              {/* Scroll indicator for mobile */}
              <div className="block md:hidden pb-2">
                <p className="text-xs text-gray-400 text-center">
                  ← Scroll to view all columns →
                </p>
              </div>
              
              <div className="border bg-black overflow-x-auto  md:overflow-visible table-scroll">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-white/5">
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm w-16">Rank</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Name</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Email</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Progress</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Badges</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student, index) => (
                    <TableRow
                      key={student.id}
                      className={`border-gray-700 ${
                        student.isCurrentUser
                          ? 'bg-white/10 hover:bg-accent'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getPositionIcon(index) || (
                            <span className="text-gray-400 font-semibold">#{index + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 md:gap-3">
                          
                          <div className="flex items-center gap-1 md:gap-2">
                            <span className="font-medium text-white text-xs md:text-sm whitespace-nowrap">{student.name}</span>
                            {student.isCurrentUser && (
                              <Badge className="bg-white text-black text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs md:text-sm">{student.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-20 md:w-32 h-2 bg-accent rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-500"
                              style={{ width: `${student.progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-semibold text-xs md:text-sm whitespace-nowrap">
                            {student.progressPercentage.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 md:gap-2">
                          <Trophy className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                          <span className="text-white font-semibold text-xs md:text-sm">
                            {student.badgesCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.certificateIssued ? (
                          <div className="flex items-center gap-1 md:gap-2">
                            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                            <span className="text-green-400 text-xs md:text-sm font-medium whitespace-nowrap">Issued</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 md:gap-2">
                            <XCircle className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                            <span className="text-gray-500 text-xs md:text-sm whitespace-nowrap">Not Issued</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}

          {/* Stats Summary */}
          {sortedStudents.length > 0 && (
            <div className="mt-4 md:mt-6 grid grid-cols-3 gap-2 md:gap-4">
              <div className="bg-accent border p-2 md:p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-1">Total Students</p>
                <p className="text-lg md:text-2xl font-bold text-white">{sortedStudents.length}</p>
              </div>
              <div className="bg-accent border p-2 md:p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-1">Average Progress</p>
                <p className="text-lg md:text-2xl font-bold text-white">
                  {(
                    sortedStudents.reduce((sum, s) => sum + s.progressPercentage, 0) /
                    sortedStudents.length
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <div className="bg-accent border p-2 md:p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-1">Your Rank</p>
                <p className="text-lg md:text-2xl font-bold text-white">
                  #{sortedStudents.findIndex((s) => s.isCurrentUser) + 1}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Close Button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-white text-black hover:bg-gray-200"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
