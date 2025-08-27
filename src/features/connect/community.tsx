import { useState, useEffect } from "react";
import { communityService } from "@/service/community.server";
import type { Post, CreatePostRequest, CreateCommentRequest, Comment, CommunityUser } from "@/service/community.server";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "react-toastify";


export default function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    location: "",
    files: [] as File[]
  });
  
  // Comments state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  
  // Edit reply state
  const [editingReply, setEditingReply] = useState<{ id: string; content: string } | null>(null);
  
  // Get current user info
  const currentUser = useAuthStore(state => state.user);


  const canCreatePosts = communityService.canCreatePosts();

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading community posts...');
      const response = await communityService.getTimelinePosts();
      console.log('API response:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Setting posts:', response.data);
        setPosts(response.data);
      } else if (response && Array.isArray(response)) {
        // Handle case where API returns posts array directly
        console.log('API returned posts array directly:', response);
        setPosts(response);
      } else {
        console.warn('API response data is not an array:', response);
        setPosts([]);
        setError(response?.message || 'Failed to load posts - invalid data format');
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setPosts([]);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${post.user.firstName} ${post.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewPost = () => {
    if (!canCreatePosts) {
      setError('You do not have permission to create posts');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({ content: "", location: "", files: [] });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.content.trim() && formData.files.length === 0) {
      setError('Please provide either content or images for your post');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const createData: CreatePostRequest = {
        content: formData.content.trim() || undefined,
        location: formData.location.trim() || undefined,
        files: formData.files.length > 0 ? formData.files : undefined
      };

      const response = await communityService.createPost(createData);
      
      if (response.success) {
        // Reload posts to show the new one
        await loadPosts();
    handleCloseModal();
      } else {
        setError(response.message || 'Failed to create post');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      console.log('Liking post:', postId);
      const response = await communityService.toggleLikePost(postId);
      console.log('Like response:', response);
      
      if (response && response.success && response.data) {
        // Update the post in the local state
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
              likes: response.data.likes,
              liked: response.data.liked
        };
      }
      return post;
    }));
        console.log('Post updated successfully');
      } else {
        console.error('Like response invalid:', response);
        setError(response?.message || 'Failed to like post');
      }
    } catch (err) {
      console.error('Error liking post:', err);
      setError(err instanceof Error ? err.message : 'Failed to like post');
    }
  };

  const handleComment = async (postId: string) => {
    const comment = commentText[postId];
    if (!comment || !comment.trim()) return;

    try {
      console.log('Adding comment to post:', postId, comment);
      const commentData: CreateCommentRequest = { content: comment.trim() };
      const response = await communityService.createComment(postId, commentData);
      console.log('Comment response:', response);
      
      if (response && response.success && response.data) {
        // Create a properly formatted comment with user data
        const newComment = response.data;
        
        // Ensure the comment has proper user data structure
        let commentUser: CommunityUser;
        if (typeof newComment.user === 'string' && currentUser) {
          // Convert User to CommunityUser format
          commentUser = {
            _id: currentUser._id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatar: currentUser.avatar || 'https://picsum.photos/200/300', // Fallback avatar
            lastOnline: new Date().toISOString()
          };
        } else if (newComment.user && typeof newComment.user === 'object' && 'firstName' in newComment.user) {
          // User data is already properly formatted
          commentUser = newComment.user as CommunityUser;
        } else {
          // Fallback to current user if user data is missing
          commentUser = {
            _id: currentUser?._id || 'unknown',
            firstName: currentUser?.firstName || 'Unknown',
            lastName: currentUser?.lastName || 'User',
            avatar: currentUser?.avatar || 'https://picsum.photos/200/300',
            lastOnline: new Date().toISOString()
          };
        }
        
        const formattedComment: Comment = {
          ...newComment,
          user: commentUser,
          likesCount: newComment.likesCount || 0,
          liked: newComment.liked || false,
          repliesCount: newComment.repliesCount || 0
        };
        
        // Update comments list if comments modal is open
        if (showCommentsModal && selectedPost && selectedPost._id === postId) {
          setComments(prevComments => [formattedComment, ...prevComments]);
        }
        
        // Update post comment count
        setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
            return { ...post, comments: post.comments + 1 };
          }
          return post;
        }));
        
        // Clear comment input
        setCommentText({ ...commentText, [postId]: "" });
        console.log('Comment added successfully');
        
        // Show success toast
        toast.success('Comment added successfully!');
      } else {
        console.error('Comment response invalid:', response);
        setError(response?.message || 'Failed to add comment');
        toast.error('Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  // Load comments for a specific post
  const loadComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      console.log('Loading comments for post:', postId);
      const response = await communityService.getPostComments(postId);
      console.log('Comments API response:', response);
      
      let commentsData: Comment[] = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response && Array.isArray(response)) {
        // Handle case where API returns comments array directly
        commentsData = response;
      } else {
        console.warn('Comments API response data is not an array:', response);
        setComments([]);
        setError('Failed to load comments');
        return;
      }
      
      // Ensure all comments have proper user data structure
      const formattedComments = commentsData.map(comment => {
        let commentUser: CommunityUser;
        
        if (typeof comment.user === 'string') {
          // If user is just an ID string, use current user data
          commentUser = {
            _id: currentUser?._id || 'unknown',
            firstName: currentUser?.firstName || 'Unknown',
            lastName: currentUser?.lastName || 'User',
            avatar: currentUser?.avatar || 'https://picsum.photos/200/300',
            lastOnline: new Date().toISOString()
          };
        } else if (comment.user && typeof comment.user === 'object' && 'firstName' in comment.user) {
          // User data is already properly formatted
          commentUser = comment.user as CommunityUser;
        } else {
          // Fallback to current user if user data is missing
          commentUser = {
            _id: currentUser?._id || 'unknown',
            firstName: currentUser?.firstName || 'Unknown',
            lastName: currentUser?.lastName || 'User',
            avatar: currentUser?.avatar || 'https://picsum.photos/200/300',
            lastOnline: new Date().toISOString()
          };
        }
        
        // Also ensure replies have proper user data
        const formattedReplies = (comment.replies || []).map(reply => {
          let replyUser: CommunityUser;
          
          if (typeof reply.user === 'string') {
            replyUser = {
              _id: currentUser?._id || 'unknown',
              firstName: currentUser?.firstName || 'Unknown',
              lastName: currentUser?.lastName || 'User',
              avatar: currentUser?.avatar || 'https://picsum.photos/200/300',
              lastOnline: new Date().toISOString()
            };
          } else if (reply.user && typeof reply.user === 'object' && 'firstName' in reply.user) {
            replyUser = reply.user as CommunityUser;
          } else {
            replyUser = {
              _id: currentUser?._id || 'unknown',
              firstName: currentUser?.firstName || 'Unknown',
              lastName: currentUser?.lastName || 'User',
              avatar: currentUser?.avatar || 'https://picsum.photos/200/300',
              lastOnline: new Date().toISOString()
            };
          }
          
          return {
            ...reply,
            user: replyUser,
            likesCount: reply.likesCount || 0,
            liked: reply.liked || false,
            repliesCount: reply.repliesCount || 0
          };
        });
        
        return {
          ...comment,
          user: commentUser,
          likesCount: comment.likesCount || 0,
          liked: comment.liked || false,
          repliesCount: comment.repliesCount || 0,
          replies: formattedReplies
        };
      });
      
      console.log('Setting formatted comments:', formattedComments);
      setComments(formattedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
      setError('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Open comments modal
  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    await loadComments(post._id);
  };

  // Close comments modal
  const handleCloseCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedPost(null);
    setComments([]);
    setEditingComment(null);
    setEditingReply(null);
  };

  // Like a comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await communityService.toggleLikeComment(commentId);
      
      if (response && response.success && response.data) {
        // Update the comment in local state with full response data
        setComments(comments.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              ...response.data, // Use full response data to ensure all fields are updated
              likes: response.data.likes,
              likesCount: response.data.likesCount,
              liked: response.data.liked
            };
          }
          return comment;
        }));
        
        // Show success toast
        const action = response.data.liked ? 'liked' : 'unliked';
        toast.success(`Comment ${action} successfully!`);
      } else {
        setError('Failed to like comment');
        toast.error('Failed to like comment');
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment');
      toast.error('Failed to like comment');
    }
  };

  // Like a reply
  const handleLikeReply = async (replyId: string) => {
    try {
      const response = await communityService.toggleLikeComment(replyId);
      
      if (response && response.success && response.data) {
        // Update the reply in local state by finding it in comments
        setComments(comments.map(comment => {
          // Check if this comment has the reply we're liking
          if (comment.replies && comment.replies.length > 0) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply._id === replyId) {
                return {
                  ...reply,
                  ...response.data, // Use full response data to ensure all fields are updated
                  likes: response.data.likes,
                  likesCount: response.data.likesCount,
                  liked: response.data.liked
                };
              }
              return reply;
            });
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        }));
        
        // Show success toast
        const action = response.data.liked ? 'liked' : 'unliked';
        toast.success(`Reply ${action} successfully!`);
      } else {
        setError('Failed to like reply');
        toast.error('Failed to like reply');
      }
    } catch (err) {
      console.error('Error liking reply:', err);
      setError('Failed to like reply');
      toast.error('Failed to like reply');
    }
  };

  // Start editing a comment
  const handleStartEditComment = (comment: Comment) => {
    setEditingComment({ id: comment._id, content: comment.content });
  };

  // Cancel editing comment
  const handleCancelEditComment = () => {
    setEditingComment(null);
  };

  // Submit edited comment
  const handleSubmitEditComment = async () => {
    if (!editingComment || !editingComment.content.trim()) return;

    try {
      const response = await communityService.updateComment(editingComment.id, {
        content: editingComment.content.trim()
      });

      if (response && response.success && response.data) {
        // Update the comment in local state while preserving user data
        setComments(comments.map(comment => {
          if (comment._id === editingComment.id) {
            // Preserve the original user data and other fields, only update content and API response fields
            return {
              ...comment, // Keep all original fields including user data
              content: editingComment.content.trim(),
              updatedAt: response.data.updatedAt || comment.updatedAt,
              // Only update fields that come from the API response, preserve user data
              likesCount: response.data.likesCount !== undefined ? response.data.likesCount : comment.likesCount,
              liked: response.data.liked !== undefined ? response.data.liked : comment.liked,
              repliesCount: response.data.repliesCount !== undefined ? response.data.repliesCount : comment.repliesCount
            };
          }
          return comment;
        }));
        setEditingComment(null);
        toast.success('Comment updated successfully!');
      } else {
        setError('Failed to update comment');
        toast.error('Failed to update comment');
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment');
      toast.error('Failed to update comment');
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    // Use toastify confirmation instead of window.confirm
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.info(
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete this comment?</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => resolve(true)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => resolve(false)}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
        }
      );
    });

    if (!confirmed) return;

    try {
      const response = await communityService.deleteComment(commentId);
      
      if (response && response.success) {
        // Remove the comment from local state
        setComments(comments.filter(comment => comment._id !== commentId));
        // Update the post comment count
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            comments: selectedPost.comments - 1
          });
        }
        // Update posts list comment count
        setPosts(prevPosts => prevPosts.map(post => {
          if (post._id === selectedPost?._id) {
            return { ...post, comments: post.comments - 1 };
        }
        return post;
      }));
        
        toast.success('Comment deleted successfully!');
      } else {
        setError('Failed to delete comment');
        toast.error('Failed to delete comment');
      }
    } catch (err) {
      setError('Failed to delete comment');
      toast.error('Failed to delete comment');
    }
  };

  // Start replying to a comment
  const handleStartReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyText({ ...replyText, [commentId]: "" });
  };

  // Cancel replying to a comment
  const handleCancelReply = (commentId: string) => {
    setReplyingTo(null);
    setReplyText({ ...replyText, [commentId]: "" });
  };

  // Submit a reply to a comment
  const handleSubmitReply = async (commentId: string) => {
    const reply = replyText[commentId];
    if (!reply || !reply.trim()) return;

    try {
      const replyData: CreateCommentRequest = { content: reply.trim() };
      const response = await communityService.createReply(commentId, replyData);
      
      if (response && response.success && response.data) {
        // Add the new reply to local state
        const newReply = response.data;
        
        // Ensure the reply has proper user data structure
        let replyUser: CommunityUser;
        if (typeof newReply.user === 'string' && currentUser) {
          // Convert User to CommunityUser format
          replyUser = {
            _id: currentUser._id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatar: currentUser.avatar || 'https://picsum.photos/200/300', // Fallback avatar
            lastOnline: new Date().toISOString()
          };
        } else if (newReply.user && typeof newReply.user === 'object' && 'firstName' in newReply.user) {
          // User data is already properly formatted
          replyUser = newReply.user as CommunityUser;
        } else {
          // Fallback to current user if user data is missing
          replyUser = {
            _id: currentUser?._id || 'unknown',
            firstName: currentUser?.firstName || 'Unknown',
            lastName: currentUser?.lastName || 'User',
            avatar: currentUser?.avatar || 'https://picsum.photos/200/300',
            lastOnline: new Date().toISOString()
          };
        }
        
        const formattedReply: Comment = {
          ...newReply,
          user: replyUser,
          likesCount: newReply.likesCount || 0,
          liked: newReply.liked || false,
          repliesCount: newReply.repliesCount || 0
        };
        
        // Update comments list to include the new reply
        setComments(prevComments => prevComments.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), formattedReply],
              repliesCount: (comment.repliesCount || 0) + 1
            };
          }
          return comment;
        }));

        // Clear reply input and close reply form
        setReplyText({ ...replyText, [commentId]: "" });
        setReplyingTo(null);
        
        toast.success('Reply added successfully!');
      } else {
        setError('Failed to add reply');
        toast.error('Failed to add reply');
      }
    } catch (err) {
      setError('Failed to add reply');
      toast.error('Failed to add reply');
    }
  };

  // Start editing a reply
  const handleStartEditReply = (reply: Comment) => {
    setEditingReply({ id: reply._id, content: reply.content });
  };

  // Cancel editing reply
  const handleCancelEditReply = () => {
    setEditingReply(null);
  };

  // Submit edited reply
  const handleSubmitEditReply = async () => {
    if (!editingReply || !editingReply.content.trim()) return;

    try {
      const response = await communityService.updateComment(editingReply.id, {
        content: editingReply.content.trim()
      });

      if (response && response.success && response.data) {
        // Update the reply in local state while preserving user data
        setComments(comments.map(comment => {
          if (comment.replies && comment.replies.length > 0) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply._id === editingReply.id) {
                // Preserve the original user data and other fields, only update content and API response fields
                return {
                  ...reply, // Keep all original fields including user data
                  content: editingReply.content.trim(),
                  updatedAt: response.data.updatedAt || reply.updatedAt,
                  // Only update fields that come from the API response, preserve user data
                  likesCount: response.data.likesCount !== undefined ? response.data.likesCount : reply.likesCount,
                  liked: response.data.liked !== undefined ? response.data.liked : reply.liked,
                  repliesCount: response.data.repliesCount !== undefined ? response.data.repliesCount : reply.repliesCount
                };
              }
              return reply;
            });
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        }));
        
        setEditingReply(null);
        toast.success('Reply updated successfully!');
      } else {
        setError('Failed to update reply');
        toast.error('Failed to update reply');
      }
    } catch (err) {
      console.error('Error updating reply:', err);
      setError('Failed to update reply');
      toast.error('Failed to update reply');
    }
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    console.log("Share post:", postId);
  };



  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const rules = communityService.getFileUploadRules();
    
    // Validate file count
    if (files.length > rules.maxFiles) {
      setError(`Maximum ${rules.maxFiles} files allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!rules.supportedFormats.includes(file.type)) {
        setError(`Unsupported file type: ${file.type}`);
        return false;
      }
      if (file.size > rules.maxFileSize) {
        setError(`File too large: ${file.name} (max ${rules.maxFileSize / (1024 * 1024)}MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === files.length) {
      setFormData({ ...formData, files: validFiles });
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      files: formData.files.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-primary)] dark:bg-gray-900 rounded-2xl p-6 h-full">
        <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-2xl p-6 h-full shadow-sm flex flex-col">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-12 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded mb-6"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-primary)] dark:bg-gray-900 rounded-2xl p-6 h-full">
      <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-2xl p-6 h-full shadow-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-white">Community</h1>
          {canCreatePosts && (
          <button 
            onClick={handleNewPost}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Post
          </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6 flex-shrink-0">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-4 pr-12 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-[var(--text-secondary)] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Posts List - Scrollable Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div key={post._id} className="bg-[var(--bg-card)] dark:bg-gray-700 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] dark:bg-gray-600 flex-shrink-0">
                    <img
                      src={post.user.avatar}
                      alt={`${post.user.firstName} ${post.user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--text-primary)] dark:text-white text-lg mb-1">
                      {post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : 'No content'}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                      {post.user.firstName} {post.user.lastName} • {communityService.formatPostDate(post.createdAt)} • {communityService.formatPostTime(post.createdAt)}
                    </p>
                    {post.location && (
                      <p className="text-sm text-[var(--text-tertiary)] dark:text-gray-500 mt-1">
                        📍 {post.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                {post.content && (
                <div className="mb-6">
                  <p className="text-[var(--text-secondary)] dark:text-gray-300 text-sm leading-relaxed">
                    {post.content}
                  </p>
                </div>
                )}

                {/* Post Photos */}
                {post.photos && post.photos.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {post.photos.map((photo, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={photo}
                            alt={`Post photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      post.liked 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'bg-[var(--bg-secondary)] dark:bg-gray-600 text-[var(--text-secondary)] dark:text-gray-400 hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm font-medium">{formatNumber(post.likes)}</span>
                  </button>

                  {/* Comments Button */}
                  <button 
                     onClick={() => handleOpenComments(post)}
                     className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] dark:bg-gray-600 text-[var(--text-secondary)] dark:text-gray-400 rounded-lg hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-medium">{formatNumber(post.comments)}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post._id)}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] dark:bg-gray-600 text-[var(--text-secondary)] dark:text-gray-400 rounded-lg hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>

                {/* Comment Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type a comment..."
                    value={commentText[post._id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                    className="flex-1 px-4 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    disabled={!commentText[post._id] || !commentText[post._id].trim()}
                    className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)] dark:text-gray-400">
              {searchQuery ? "No posts found matching your search." : "No posts yet."}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[60vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">Create a Post</h2>
                <button 
                  onClick={handleCloseModal} 
                  className="text-orange-500 hover:text-orange-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Post Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Post Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write something here..."
                  rows={4}
                  className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white resize-none"
                />
              </div>

              {/* Location Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where are you posting from?"
                  className="w-full p-4 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
                />
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-primary)] dark:text-white mb-2">
                  Upload Images (optional, max 5)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose Images
                </label>
                
                                {/* Selected Files Display */}
                {formData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-[var(--text-secondary)] dark:text-gray-300">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-auto text-red-500 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={(!formData.content.trim() && formData.files.length === 0) || submitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">
                  Comments ({selectedPost.comments})
                </h2>
                <button 
                  onClick={handleCloseCommentsModal} 
                  className="text-orange-500 hover:text-orange-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Add New Comment */}
              <div className="mb-6 p-4 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText[selectedPost._id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [selectedPost._id]: e.target.value })}
                    className="flex-1 px-4 py-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-600 text-[var(--text-primary)] dark:text-white"
                  />
                  <button
                    onClick={() => handleComment(selectedPost._id)}
                    disabled={!commentText[selectedPost._id] || !commentText[selectedPost._id].trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {loadingComments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-[var(--text-secondary)] dark:text-gray-400 mt-2">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-secondary)] dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="border border-[var(--border-primary)] dark:border-gray-600 rounded-lg p-4">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-tertiary)] dark:bg-gray-600">
                            {typeof comment.user === 'object' && comment.user.avatar ? (
                              <img
                                src={comment.user.avatar}
                                alt={`${comment.user.firstName} ${comment.user.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[var(--bg-tertiary)] dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-xs text-[var(--text-secondary)] dark:text-gray-400">?</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--text-primary)] dark:text-white">
                              {typeof comment.user === 'object' 
                                ? `${comment.user.firstName} ${comment.user.lastName}`
                                : 'Unknown User'
                              }
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                                                 {/* Comment Actions */}
                         <div className="flex items-center gap-2">
                                                       {/* Like Comment Button */}
                            <button
                              onClick={() => handleLikeComment(comment._id)}
                              className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                                comment.liked 
                                  ? 'text-red-600 hover:text-red-700' 
                                  : 'text-gray-600 hover:text-blue-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={comment.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{comment.likesCount || 0}</span>
                            </button>
                           
                           {/* Reply Button */}
                           <button
                             onClick={() => handleStartReply(comment._id)}
                             className="px-2 py-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                           >
                             Reply
                           </button>
                           
                           {/* Edit/Delete buttons for user's own comments */}
                           {typeof comment.user === 'object' && currentUser && comment.user._id === currentUser._id && (
                             <>
                               <button
                                 onClick={() => handleStartEditComment(comment)}
                                 className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                               >
                                 Edit
                               </button>
                               <button
                                 onClick={() => handleDeleteComment(comment._id)}
                                 className="px-2 py-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                               >
                                 Delete
                               </button>
                             </>
                           )}
                         </div>
                      </div>

                                             {/* Comment Content */}
                       {editingComment && editingComment.id === comment._id ? (
                         <div className="mt-3">
                           <textarea
                             value={editingComment.content}
                             onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                             className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white resize-none"
                             rows={3}
                           />
                           <div className="flex gap-2 mt-2">
                             <button
                               onClick={handleSubmitEditComment}
                               className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                             >
                               Save
                             </button>
                             <button
                               onClick={handleCancelEditComment}
                               className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                             >
                               Cancel
                             </button>
                           </div>
                         </div>
                       ) : (
                         <p className="text-[var(--text-secondary)] dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                       )}

                       {/* Reply Input */}
                       {replyingTo === comment._id && (
                         <div className="mt-3 p-3 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg">
                           <textarea
                             value={replyText[comment._id] || ""}
                             onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                             placeholder="Write a reply..."
                             className="w-full p-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-600 text-[var(--text-primary)] dark:text-white resize-none"
                             rows={2}
                           />
                           <div className="flex gap-2 mt-2">
                             <button
                               onClick={() => handleSubmitReply(comment._id)}
                               disabled={!replyText[comment._id] || !replyText[comment._id].trim()}
                               className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                             >
                               Reply
                             </button>
                             <button
                               onClick={() => handleCancelReply(comment._id)}
                               className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                             >
                               Cancel
                             </button>
                           </div>
                         </div>
                       )}

                       {/* Replies Display */}
                       {comment.replies && comment.replies.length > 0 && (
                         <div className="mt-3 ml-6 space-y-3">
                           <div className="border-l-2 border-gray-200 pl-3">
                             {comment.replies.map((reply) => (
                               <div key={reply._id} className="mb-3 p-3 bg-gray-50 rounded-lg">
                                 {/* Reply Header */}
                                 <div className="flex items-start justify-between mb-2">
                                   <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                                       {typeof reply.user === 'object' && reply.user.avatar ? (
                                         <img
                                           src={reply.user.avatar}
                                           alt={`${reply.user.firstName} ${reply.user.lastName}`}
                                           className="w-full h-full object-cover"
                                         />
                                       ) : (
                                         <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                           <span className="text-xs text-gray-600">?</span>
                                         </div>
                                       )}
                                     </div>
                                     <div>
                                       <p className="font-medium text-xs text-gray-800">
                                         {typeof reply.user === 'object' 
                                           ? `${reply.user.firstName} ${reply.user.lastName}`
                                           : 'Unknown User'
                                         }
                                       </p>
                                       <p className="text-xs text-gray-500">
                                         {new Date(reply.createdAt).toLocaleDateString()}
                                       </p>
                                     </div>
                                   </div>
                                   
                                   {/* Reply Actions */}
                                   <div className="flex items-center gap-2">
                                                                           {/* Like Reply Button */}
                                      <button
                                        onClick={() => handleLikeReply(reply._id)}
                                        className={`flex items-center gap-1 px-1 py-1 text-xs transition-colors ${
                                          reply.liked 
                                            ? 'text-red-600 hover:text-red-700' 
                                            : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                      >
                                        <svg className="w-3 h-3" fill={reply.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <span>{reply.likesCount || 0}</span>
                                      </button>
                                     
                                                                           {/* Edit/Delete buttons for user's own replies */}
                                      {typeof reply.user === 'object' && currentUser && reply.user._id === currentUser._id && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditReply(reply)}
                                            className="px-1 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteComment(reply._id)}
                                            className="px-1 py-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Reply Content */}
                                  {editingReply && editingReply.id === reply._id ? (
                                    <div className="mt-3">
                                      <textarea
                                        value={editingReply.content}
                                        onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-xs"
                                        rows={2}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={handleSubmitEditReply}
                                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEditReply}
                                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-700 text-xs leading-relaxed">{reply.content}</p>
                                  )}
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
