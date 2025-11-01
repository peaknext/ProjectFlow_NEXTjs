"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, MessageSquare, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useServiceRequest,
  useRequestComments,
  useAddRequestComment,
} from "@/hooks/use-service-requests";
import { useAuth } from "@/hooks/use-auth";
import { ITServiceLayout } from "@/components/layout/it-service-layout";
import { RequestTimeline } from "@/components/it-service/request-timeline";
import { QueuePositionCard } from "@/components/it-service/queue-position-card";
import { ApproveRequestModal } from "@/components/it-service/approve-request-modal";
import { RejectRequestModal } from "@/components/it-service/reject-request-modal";
import { FeedbackModal } from "@/components/it-service/feedback-modal";
import { FeedbackCard } from "@/components/it-service/feedback-card";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { RequestStatus } from "@/generated/prisma";

/**
 * Request Detail Page (Conditional UI)
 *
 * URL: /it-service/[id]
 *
 * USER role: Clean layout with ITServiceLayout
 * non-USER roles: Card-based layout with DesktopLayout (sidebar)
 *
 * Features:
 * - Full request details with document preview
 * - Timeline of all actions
 * - Queue position (for PENDING requests)
 * - Comments section with add comment functionality
 * - Approve/Reject buttons (for approvers on PENDING requests)
 * - Approval workflow with project selection
 * - Print document button
 * - Status badge
 * - Back to list navigation
 *
 * Permissions:
 * - All users can view their own requests and add comments
 * - HEAD, LEADER, CHIEF, ADMIN, SUPER_ADMIN can approve/reject PENDING requests
 */
export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Fetch request data
  const { data: request, isLoading } = useServiceRequest(id);
  const { data: comments, isLoading: commentsLoading } = useRequestComments(id);
  const addCommentMutation = useAddRequestComment(id);

  // Check roles
  const isUserRole = user?.role === "USER";

  // Auto-open feedback modal when request is completed and no feedback yet
  useEffect(() => {
    if (
      request &&
      request.status === "COMPLETED" &&
      !request.feedback &&
      user?.id === request.requesterId
    ) {
      setFeedbackModalOpen(true);
    }
  }, [request, user]);

  // Check if current user can approve requests
  // Approvers: HEAD, LEADER, CHIEF, ADMIN, SUPER_ADMIN
  const canApprove = user && ["HEAD", "LEADER", "CHIEF", "ADMIN", "SUPER_ADMIN"].includes(user.role);

  // Handle print
  const handlePrint = () => {
    if (!request) return;

    // Create a new window with the document HTML
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(request.documentHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    await addCommentMutation.mutateAsync({
      commentText: commentText.trim(),
    });

    setCommentText("");
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "outline";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "IN_PROGRESS":
        return "secondary";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "secondary";
      default:
        return "default";
    }
  };

  // Get status label
  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "รอดำเนินการ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ปฏิเสธ";
      case "IN_PROGRESS":
        return "กำลังดำเนินการ";
      case "COMPLETED":
        return "เสร็จสิ้น";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">ไม่พบคำร้อง</p>
        <Button onClick={() => router.push("/it-service/requests")} variant="outline">
          กลับไปหน้ารายการคำร้อง
        </Button>
      </div>
    );
  }

  // ===== USER Role: Clean UI with ITServiceLayout =====
  if (isUserRole) {
    return (
      <ITServiceLayout>
        <div className="space-y-6">
          {/* Header */}
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/it-service/requests")}
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">ติดตามคำร้อง</h1>
                <p className="text-muted-foreground font-mono">{request.requestNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(request.status)} className="text-sm px-4 py-2">
                {getStatusLabel(request.status)}
              </Badge>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                พิมพ์เอกสาร
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Document Preview */}
            <div className="lg:col-span-2">
              <div className="border rounded-lg p-6 bg-card">
                <h2 className="font-semibold mb-4">เอกสารคำร้อง</h2>
                {/* A4 Paper Preview Container */}
                <div className="flex justify-center bg-slate-100 dark:bg-slate-900 p-8 rounded-lg">
                  <div className="bg-white shadow-2xl" style={{ width: '21cm', minHeight: '29.7cm' }}>
                    <iframe
                      srcDoc={request.documentHtml}
                      className="w-full h-full border-0"
                      style={{ minHeight: '29.7cm' }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Feedback, Queue, Timeline & Comments */}
            <div className="space-y-6">
              {/* Feedback Card (only for COMPLETED requests) */}
              {request.status === "COMPLETED" && (
                <FeedbackCard
                  requestId={id}
                  requestNumber={request.requestNumber}
                  existingFeedback={request.feedback}
                  isRequester={user?.id === request.requesterId}
                />
              )}

              {/* Queue Position */}
              <QueuePositionCard
                requestId={id}
                requestType={request.type}
                status={request.status}
              />

              {/* Timeline */}
              <RequestTimeline
                requestId={id}
                createdAt={request.createdAt}
                status={request.status}
                completedAt={
                  request.status === "APPROVED"
                    ? request.approvedAt
                    : ["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status)
                    ? request.updatedAt
                    : null
                }
                task={request.task}
              />

              {/* Comments */}
              <div className="border rounded-lg p-6 bg-card space-y-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  ความคิดเห็น ({comments?.length || 0})
                </h2>

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="text-center text-muted-foreground py-4">
                    กำลังโหลด...
                  </div>
                ) : !comments || comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    ยังไม่มีความคิดเห็น
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm">
                            {comment.commentor.firstName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {`${comment.commentor.titlePrefix}${comment.commentor.firstName} ${comment.commentor.lastName}`}
                            </span>
                            {comment.commentor.jobTitle && (
                              <span className="text-xs text-muted-foreground">
                                ({comment.commentor.jobTitle.jobTitleTh})
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(comment.createdAt),
                                "d MMM yyyy HH:mm",
                                { locale: th }
                              )}
                            </span>
                          </div>
                          <p className="text-sm">{comment.commentText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form - Hidden when request is COMPLETED */}
                {request.status !== "COMPLETED" && (
                  <>
                    <Separator />

                    <div className="space-y-3">
                      <Textarea
                        placeholder="เพิ่มความคิดเห็น..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                        disabled={addCommentMutation.isPending}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!commentText.trim() || addCommentMutation.isPending}
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {addCommentMutation.isPending ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Modal - Auto-open when request completed and no feedback yet */}
        <FeedbackModal
          requestId={id}
          requestNumber={request.requestNumber}
          open={feedbackModalOpen}
          onOpenChange={setFeedbackModalOpen}
        />
      </ITServiceLayout>
    );
  }

  // ===== non-USER Roles: Card-based UI with DesktopLayout (sidebar) =====
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/it-service/requests")}
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>ติดตามคำร้อง</CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {request.requestNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(request.status)} className="text-sm px-4 py-2">
                {getStatusLabel(request.status)}
              </Badge>

              {/* Approval Actions - Only for approvers on PENDING requests */}
              {canApprove && request.status === "PENDING" && (
                <>
                  <Button
                    onClick={() => setApproveModalOpen(true)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    อนุมัติคำร้อง
                  </Button>
                  <Button
                    onClick={() => setRejectModalOpen(true)}
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    ไม่อนุมัติ
                  </Button>
                </>
              )}

              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                พิมพ์เอกสาร
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Preview */}
        <div className="lg:col-span-2">
          {/* Document Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>เอกสารคำร้อง</CardTitle>
            </CardHeader>
            <CardContent>
              {/* A4 Paper Preview Container */}
              <div className="flex justify-center bg-slate-100 dark:bg-slate-900 p-8 rounded-lg">
                <div className="bg-white shadow-2xl" style={{ width: '21cm', minHeight: '29.7cm' }}>
                  <iframe
                    srcDoc={request.documentHtml}
                    className="w-full h-full border-0"
                    style={{ minHeight: '29.7cm' }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Feedback, Queue, Timeline & Comments */}
        <div className="space-y-6">
          {/* Feedback Card (only for COMPLETED requests) */}
          {request.status === "COMPLETED" && (
            <FeedbackCard
              requestId={id}
              requestNumber={request.requestNumber}
              existingFeedback={request.feedback}
              isRequester={user?.id === request.requesterId}
            />
          )}

          {/* Queue Position (only for PENDING status) */}
          <QueuePositionCard
            requestId={id}
            requestType={request.type}
            status={request.status}
          />

          {/* Timeline */}
          <RequestTimeline
            requestId={id}
            createdAt={request.createdAt}
            status={request.status}
            completedAt={
              request.status === "APPROVED"
                ? request.approvedAt
                : ["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status)
                ? request.updatedAt
                : null
            }
            task={request.task}
          />

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                ความคิดเห็น ({comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center text-muted-foreground py-4">
                  กำลังโหลด...
                </div>
              ) : !comments || comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  ยังไม่มีความคิดเห็น
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {comment.commentor.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {`${comment.commentor.titlePrefix}${comment.commentor.firstName} ${comment.commentor.lastName}`}
                          </span>
                          {comment.commentor.jobTitle && (
                            <span className="text-xs text-muted-foreground">
                              ({comment.commentor.jobTitle.jobTitleTh})
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(comment.createdAt),
                              "d MMM yyyy HH:mm",
                              { locale: th }
                            )}
                          </span>
                        </div>
                        <p className="text-sm">{comment.commentText}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form - Hidden when request is COMPLETED */}
              {request.status !== "COMPLETED" && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <Textarea
                      placeholder="เพิ่มความคิดเห็น..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      disabled={addCommentMutation.isPending}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {addCommentMutation.isPending ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Modals */}
      <ApproveRequestModal
        requestId={id}
        requestNumber={request.requestNumber}
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
      />

      <RejectRequestModal
        requestId={id}
        requestNumber={request.requestNumber}
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
      />

      {/* Feedback Modal - Auto-open when request completed and no feedback yet */}
      <FeedbackModal
        requestId={id}
        requestNumber={request.requestNumber}
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
      />
    </div>
  );
}
