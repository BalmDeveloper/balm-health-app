import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Share,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { generateAnonymousUsername, getCurrentUsername, getCommunityMemberCount } from '../services/usernameService';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, arrayUnion, increment } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getCurrentUser } from '../services/authService';
import { requireAuth } from '../utils/authHelpers';

export default function CommunityScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    members: 0,
    todayPosts: 0
  });
  const [currentUsername, setCurrentUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [dislikedPosts, setDislikedPosts] = useState(new Set());
  const [likedComments, setLikedComments] = useState(new Set());
  const [dislikedComments, setDislikedComments] = useState(new Set());
  const [likedReplies, setLikedReplies] = useState(new Set());
  const [dislikedReplies, setDislikedReplies] = useState(new Set());
  const [editingComment, setEditingComment] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [editedReplyText, setEditedReplyText] = useState('');

  const [newPost, setNewPost] = useState({
    category: 'General',
    title: '',
    content: '',
  });

  const categories = [
    { id: 'All', name: 'All', icon: 'grid-outline', color: '#666' },
    { id: 'General', name: 'General', icon: 'chatbubble-outline', color: '#00008b' },
    { id: 'PCOS', name: 'PCOS', icon: 'flower-outline', color: '#e91e63' },
    { id: 'TTC', name: 'TTC', icon: 'heart-outline', color: '#f44336' },
    { id: 'Women\'s Health', name: 'Women\'s Health', icon: 'female-outline', color: '#9c27b0' },
    { id: 'Men\'s Health', name: 'Men\'s Health', icon: 'male-outline', color: '#2196f3' },
  ];

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  // Load community data on component mount
  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      // Check if post belongs to current user's username
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          const username = await getCurrentUsername();
          if (username) {
            setCurrentUsername(username);
          } else {
            // Try to generate a new username if none exists
            const newUsername = await generateAnonymousUsername(currentUser.uid);
            setCurrentUsername(newUsername);
          }
        } catch (error) {
          console.error('Username generation failed:', error);
          // Try to generate a new username as fallback
          try {
            const fallbackUsername = await generateAnonymousUsername(currentUser.uid);
            setCurrentUsername(fallbackUsername);
          } catch (fallbackError) {
            console.error('Fallback username generation failed:', fallbackError);
            setCurrentUsername('Community Member');
          }
        }
      }

      // Load posts from Firestore (skip stats to avoid errors)
      try {
        const postsQuery = query(
          collection(db, 'communityPosts'),
          orderBy('timestamp', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        const loadedPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: formatTimestamp(doc.data().timestamp),
          isLiked: false
        }));

        setPosts(loadedPosts);
      } catch (error) {
        console.log('Failed to load posts, showing empty state');
        setPosts([]);
      }
      
    } catch (error) {
      console.error('Error loading community data:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle sharing a post
  const handleSharePost = async (post) => {
    try {
      const shareContent = `🌱 Balm Community Post\n\n📝 ${post.title}\n\n${post.content}\n\n👤 by ${post.author} in ${post.category}\n\n🔗 Join the conversation at Balm!`;
      
      await Share.share({
        message: shareContent,
        title: post.title,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      // Fallback: copy to clipboard
      Alert.alert('Share', 'Post link copied to clipboard!');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    let postDate;
    
    if (timestamp.toDate) {
      // Firestore Timestamp
      postDate = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // ISO string
      postDate = new Date(timestamp);
    } else {
      // Assume it's a Date object
      postDate = new Date(timestamp);
    }
    
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return postDate.toLocaleDateString();
  };

  const handlePostQuestion = async () => {
    if (!requireAuth('post questions to the community', navigation)) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (!newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and content for your question.');
      return;
    }

    try {
      // Ensure user has a username
      let username = currentUsername;
      if (!username) {
        username = await getCurrentUsername();
        if (!username) {
          // Generate a new username if none exists
          username = await generateAnonymousUsername(currentUser.uid);
        }
      }
      
      const postData = {
        category: newPost.category,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        author: username || 'Community Member',
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        likes: 0,
        replies: 0,
        isLiked: false,
        comments: []
      };

      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'communityPosts'), postData);
      
      // Update local state with new post
      const newPostWithId = {
        id: docRef.id,
        ...postData,
        timestamp: 'Just now',
        isLiked: false
      };

      setPosts([newPostWithId, ...posts]);
      setNewPost({ category: 'General', title: '', content: '' });
      setShowPostModal(false);
      
      Alert.alert('Posted!', 'Your question has been shared with the community.');
      
    } catch (error) {
      console.error('Error posting question:', error);
      Alert.alert('Error', 'Failed to post your question. Please try again.');
    }
  };

  // Handle editing a post
  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPost({
      category: post.category,
      title: post.title,
      content: post.content
    });
    setShowPostModal(true);
  };

  // Handle updating a post
  const handleUpdatePost = async () => {
    if (!editingPost || !newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and content for your question.');
      return;
    }

    try {
      const postRef = doc(db, 'communityPosts', editingPost.id);
      await updateDoc(postRef, {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category: newPost.category,
        editedAt: serverTimestamp()
      });

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editingPost.id 
            ? { ...post, title: newPost.title.trim(), content: newPost.content.trim(), category: newPost.category }
            : post
        )
      );

      setEditingPost(null);
      setNewPost({ category: 'General', title: '', content: '' });
      setShowPostModal(false);
      
      Alert.alert('Updated!', 'Your post has been updated.');
      
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update your post. Please try again.');
    }
  };

  // Handle deleting a post
  const handleDeletePost = (post) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const postRef = doc(db, 'communityPosts', post.id);
              await deleteDoc(postRef);
              
              // Update local state
              setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
              
              Alert.alert('Deleted', 'Your post has been deleted.');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete your post. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle opening comments modal
  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  // Handle adding a comment
  const handleAddComment = async (postId) => {
    if (!requireAuth('comment on posts', navigation)) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (!newComment.trim() || !selectedPost) {
      Alert.alert('Missing Information', 'Please write a comment.');
      return;
    }

    try {
      // Ensure user has a username
      let username = currentUsername;
      if (!username) {
        username = await getCurrentUsername();
        if (!username) {
          // Generate a new username if none exists
          username = await generateAnonymousUsername(currentUser.uid);
        }
      }
      
      const commentData = {
        id: Date.now().toString(),
        author: username || 'Community Member',
        userId: currentUser.uid,
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      };

      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, {
        comments: arrayUnion(commentData),
        replies: increment(1)
      });

      // Update local state
      const updatedPost = {
        ...selectedPost,
        comments: [...(selectedPost.comments || []), commentData],
        replies: (selectedPost.replies || 0) + 1
      };

      setSelectedPost(updatedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === selectedPost.id ? updatedPost : post
        )
      );

      setNewComment('');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  // Handle replying to a comment
  const handleReplyToComment = (comment) => {
    setReplyingToComment(comment);
    setNewReply('');
  };

  // Handle adding a reply
  const handleAddReply = async (commentId) => {
    if (!requireAuth('reply to comments', navigation)) {
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (!newReply.trim() || !replyingToComment || !selectedPost) {
      Alert.alert('Missing Information', 'Please write a reply.');
      return;
    }

    try {
      // Ensure user has a username
      let username = currentUsername;
      if (!username) {
        username = await getCurrentUsername();
        if (!username) {
          // Generate a new username if none exists
          username = await generateAnonymousUsername(currentUser.uid);
        }
      }
      
      const replyData = {
        id: Date.now().toString(),
        author: username || 'Community Member',
        userId: currentUser.uid,
        content: newReply.trim(),
        timestamp: new Date().toISOString(),
        likes: 0
      };

      // Update the specific comment with the new reply
      const updatedComments = selectedPost.comments.map(comment => {
        if (comment.id === replyingToComment.id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), replyData]
          };
        }
        return comment;
      });

      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, {
        comments: updatedComments,
        replies: increment(1)
      });

      // Update local state
      const updatedPost = {
        ...selectedPost,
        comments: updatedComments,
        replies: (selectedPost.replies || 0) + 1
      };

      setSelectedPost(updatedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === selectedPost.id ? updatedPost : post
        )
      );

      setNewReply('');
      setReplyingToComment(null);
      
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    }
  };

  // Handle liking/unliking a post
  const handleLikePost = async (postId, isUpvote = true) => {
    if (!requireAuth('like posts', navigation)) {
      return;
    }

    try {
      const postRef = doc(db, 'communityPosts', postId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) return;

      const isLiked = likedPosts.has(postId);
      const isDisliked = dislikedPosts.has(postId);
      
      let likeChange = 0;
      let dislikeChange = 0;

      if (isUpvote) {
        // Handle upvote
        if (isLiked) {
          // Remove upvote
          likedPosts.delete(postId);
          likeChange = -1;
        } else {
          // Add upvote (remove downvote if exists)
          likedPosts.add(postId);
          likeChange = 1;
          if (isDisliked) {
            dislikedPosts.delete(postId);
            dislikeChange = -1;
          }
        }
      } else {
        // Handle downvote
        if (isDisliked) {
          // Remove downvote
          dislikedPosts.delete(postId);
          dislikeChange = -1;
        } else {
          // Add downvote (remove upvote if exists)
          dislikedPosts.add(postId);
          dislikeChange = 1;
          if (isLiked) {
            likedPosts.delete(postId);
            likeChange = -1;
          }
        }
      }

      // Update in Firestore
      const updateData = {};
      if (likeChange !== 0) updateData.likes = increment(likeChange);
      if (dislikeChange !== 0) updateData.dislikes = increment(dislikeChange);
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(postRef, updateData);
      }

      // Update local state
      setLikedPosts(new Set(likedPosts));
      setDislikedPosts(new Set(dislikedPosts));
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                likes: p.likes + likeChange,
                dislikes: (p.dislikes || 0) + dislikeChange
              } 
            : p
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle liking/unliking a comment
  const handleLikeComment = async (commentId, isUpvote = true) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const isLiked = likedComments.has(commentId);
      const isDisliked = dislikedComments.has(commentId);
      
      let likeChange = 0;
      let dislikeChange = 0;

      if (isUpvote) {
        // Handle upvote
        if (isLiked) {
          likedComments.delete(commentId);
          likeChange = -1;
        } else {
          likedComments.add(commentId);
          likeChange = 1;
          if (isDisliked) {
            dislikedComments.delete(commentId);
            dislikeChange = -1;
          }
        }
      } else {
        // Handle downvote
        if (isDisliked) {
          dislikedComments.delete(commentId);
          dislikeChange = -1;
        } else {
          dislikedComments.add(commentId);
          dislikeChange = 1;
          if (isLiked) {
            likedComments.delete(commentId);
            likeChange = -1;
          }
        }
      }

      // Update the comment in the selected post
      if (selectedPost) {
        const updatedComments = selectedPost.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: (comment.likes || 0) + likeChange,
              dislikes: (comment.dislikes || 0) + dislikeChange
            };
          }
          return comment;
        });

        const updatedPost = {
          ...selectedPost,
          comments: updatedComments
        };

        setSelectedPost(updatedPost);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === selectedPost.id ? updatedPost : post
          )
        );

        // Update in Firestore
        const postRef = doc(db, 'communityPosts', selectedPost.id);
        await updateDoc(postRef, {
          comments: updatedComments
        });
      }

      // Update state
      setLikedComments(new Set(likedComments));
      setDislikedComments(new Set(dislikedComments));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Handle liking/unliking a reply
  const handleLikeReply = async (commentId, replyId, isUpvote = true) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const isLiked = likedReplies.has(replyId);
      const isDisliked = dislikedReplies.has(replyId);
      
      let likeChange = 0;
      let dislikeChange = 0;

      if (isUpvote) {
        // Handle upvote
        if (isLiked) {
          likedReplies.delete(replyId);
          likeChange = -1;
        } else {
          likedReplies.add(replyId);
          likeChange = 1;
          if (isDisliked) {
            dislikedReplies.delete(replyId);
            dislikeChange = -1;
          }
        }
      } else {
        // Handle downvote
        if (isDisliked) {
          dislikedReplies.delete(replyId);
          dislikeChange = -1;
        } else {
          dislikedReplies.add(replyId);
          dislikeChange = 1;
          if (isLiked) {
            likedReplies.delete(replyId);
            likeChange = -1;
          }
        }
      }

      // Update the reply in the selected post
      if (selectedPost) {
        const updatedComments = selectedPost.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === replyId) {
                  return {
                    ...reply,
                    likes: (reply.likes || 0) + likeChange,
                    dislikes: (reply.dislikes || 0) + dislikeChange
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        });

        const updatedPost = {
          ...selectedPost,
          comments: updatedComments
        };

        setSelectedPost(updatedPost);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === selectedPost.id ? updatedPost : post
          )
        );

        // Update in Firestore
        const postRef = doc(db, 'communityPosts', selectedPost.id);
        await updateDoc(postRef, {
          comments: updatedComments
        });
      }

      // Update state
      setLikedReplies(new Set(likedReplies));
      setDislikedReplies(new Set(dislikedReplies));
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };
  const isMyPost = (post) => {
    const currentUser = getCurrentUser();
    return currentUser && post.userId === currentUser.uid;
  };

  const isMyComment = (comment) => {
    const currentUser = getCurrentUser();
    return currentUser && comment.userId === currentUser.uid;
  };

  const isMyReply = (reply) => {
    const currentUser = getCurrentUser();
    return currentUser && reply.userId === currentUser.uid;
  };

  // Handle editing a comment
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditedCommentText(comment.content);
  };

  // Handle updating a comment
  const handleUpdateComment = async () => {
    if (!editingComment || !editedCommentText.trim()) {
      Alert.alert('Missing Information', 'Please write a comment.');
      return;
    }

    try {
      // Update the comment in the selected post
      const updatedComments = selectedPost.comments.map(comment => {
        if (comment.id === editingComment.id) {
          return {
            ...comment,
            content: editedCommentText.trim(),
            editedAt: new Date().toISOString()
          };
        }
        return comment;
      });

      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, {
        comments: updatedComments
      });

      // Update local state
      const updatedPost = {
        ...selectedPost,
        comments: updatedComments
      };

      setSelectedPost(updatedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === selectedPost.id ? updatedPost : post
        )
      );

      setEditingComment(null);
      setEditedCommentText('');
      
      Alert.alert('Updated!', 'Your comment has been updated.');
      
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update your comment. Please try again.');
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = (comment) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the comment from the selected post
              const updatedComments = selectedPost.comments.filter(c => c.id !== comment.id);

              const postRef = doc(db, 'communityPosts', selectedPost.id);
              await updateDoc(postRef, {
                comments: updatedComments,
                replies: Math.max(0, (selectedPost.replies || 0) - 1)
              });

              // Update local state
              const updatedPost = {
                ...selectedPost,
                comments: updatedComments,
                replies: Math.max(0, (selectedPost.replies || 0) - 1)
              };

              setSelectedPost(updatedPost);
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === selectedPost.id ? updatedPost : post
                )
              );
              
              Alert.alert('Deleted', 'Your comment has been deleted.');
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete your comment. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle editing a reply
  const handleEditReply = (comment, reply) => {
    setEditingReply({ commentId: comment.id, reply });
    setEditedReplyText(reply.content);
  };

  // Handle updating a reply
  const handleUpdateReply = async () => {
    if (!editingReply || !editedReplyText.trim()) {
      Alert.alert('Missing Information', 'Please write a reply.');
      return;
    }

    try {
      // Update the reply in the selected post
      const updatedComments = selectedPost.comments.map(comment => {
        if (comment.id === editingReply.commentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === editingReply.reply.id) {
                return {
                  ...reply,
                  content: editedReplyText.trim(),
                  editedAt: new Date().toISOString()
                };
              }
              return reply;
            })
          };
        }
        return comment;
      });

      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, {
        comments: updatedComments
      });

      // Update local state
      const updatedPost = {
        ...selectedPost,
        comments: updatedComments
      };

      setSelectedPost(updatedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === selectedPost.id ? updatedPost : post
        )
      );

      setEditingReply(null);
      setEditedReplyText('');
      
      Alert.alert('Updated!', 'Your reply has been updated.');
      
    } catch (error) {
      console.error('Error updating reply:', error);
      Alert.alert('Error', 'Failed to update your reply. Please try again.');
    }
  };

  // Handle deleting a reply
  const handleDeleteReply = (comment, reply) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the reply from the comment
              const updatedComments = selectedPost.comments.map(c => {
                if (c.id === comment.id) {
                  return {
                    ...c,
                    replies: c.replies.filter(r => r.id !== reply.id)
                  };
                }
                return c;
              });

              const postRef = doc(db, 'communityPosts', selectedPost.id);
              await updateDoc(postRef, {
                comments: updatedComments,
                replies: Math.max(0, (selectedPost.replies || 0) - 1)
              });

              // Update local state
              const updatedPost = {
                ...selectedPost,
                comments: updatedComments,
                replies: Math.max(0, (selectedPost.replies || 0) - 1)
              };

              setSelectedPost(updatedPost);
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === selectedPost.id ? updatedPost : post
                )
              );
              
              Alert.alert('Deleted', 'Your reply has been deleted.');
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('Error', 'Failed to delete your reply. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => handleOpenComments(item)}
    >
      <View style={styles.postHeader}>
        <View style={styles.postCategory}>
          <View style={[styles.categoryBadge, { backgroundColor: categories.find(c => c.name === item.category)?.color || '#00008b' }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.postHeaderRight}>
          <Text style={styles.postTimestamp}>{item.timestamp}</Text>
          {isMyPost(item) && (
            <View style={styles.postActions}>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditPost(item);
                }} 
                style={styles.actionButton}
              >
                <Ionicons name="create-outline" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePost(item);
                }} 
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={16} color="#e91e63" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      
      <View style={styles.postFooter}>
        <Text style={styles.postAuthor}>by {item.author}</Text>
        <View style={styles.postFooterActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikePost(item.id, true)}
          >
            <Ionicons 
              name={likedPosts.has(item.id) ? "thumbs-up" : "thumbs-up-outline"} 
              size={16} 
              color={likedPosts.has(item.id) ? "#00008b" : "#666"} 
            />
            <Text style={[styles.actionText, likedPosts.has(item.id) && styles.likedText]}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikePost(item.id, false)}
          >
            <Ionicons 
              name={dislikedPosts.has(item.id) ? "thumbs-down" : "thumbs-down-outline"} 
              size={16} 
              color={dislikedPosts.has(item.id) ? "#e91e63" : "#666"} 
            />
            <Text style={[styles.actionText, dislikedPosts.has(item.id) && styles.dislikedText]}>{item.dislikes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenComments(item);
            }}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.actionText}>{item.replies || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleSharePost(item);
            }}
          >
            <Ionicons name="share-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="Community" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Community Support</Text>
          <Text style={styles.headerDescription}>
            Connect with others, share experiences, and get support from our caring community
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.postButton}
          onPress={() => {
            const user = getCurrentUser();
            if (!user) {
              navigation.navigate('Auth');
            } else {
              setShowPostModal(true);
            }
          }}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.postButtonText}>Ask a Question</Text>
        </TouchableOpacity>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCategoryCard
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon} 
                  size={20} 
                  color={selectedCategory === category.id ? "white" : category.color} 
                />
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.selectedCategoryName
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'All Questions' : `${selectedCategory} Questions`}
            <Text style={styles.postCount}> ({filteredPosts.length})</Text>
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading community posts...</Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Questions Yet</Text>
              <Text style={styles.emptyStateDescription}>
                Be the first to ask a question and start the conversation!
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => {
                  const user = getCurrentUser();
                  if (!user) {
                    navigation.navigate('Auth');
                  } else {
                    setShowPostModal(true);
                  }
                }}
              >
                <Text style={styles.emptyStateButtonText}>Ask First Question</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredPosts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Post Question Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPostModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingPost ? 'Edit Post' : 'Ask a Question'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPostModal(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <View style={[styles.formGroup, { marginBottom: 24 }]}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryOptions}>
                  {categories.filter(c => c.id !== 'All').map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        newPost.category === category.id && styles.selectedCategoryOption
                      ]}
                      onPress={() => setNewPost({ ...newPost, category: category.id })}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newPost.category === category.id && styles.selectedCategoryOptionText
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.titleInput}
                  placeholder="What's your question about?"
                  value={newPost.title}
                  onChangeText={(text) => setNewPost({ ...newPost, title: text })}
                  maxLength={100}
                />
                <Text style={styles.charCount}>{newPost.title.length}/100</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Details</Text>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Provide more context about your question..."
                  value={newPost.content}
                  onChangeText={(text) => setNewPost({ ...newPost, content: text })}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.charCount}>{newPost.content.length}/500</Text>
              </View>

              {/* Sticky Submit Button */}
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!newPost.title.trim() || !newPost.content.trim()) && styles.submitButtonDisabled
                  ]}
                  onPress={editingPost ? handleUpdatePost : handlePostQuestion}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                >
                  <Text style={[
                    styles.submitButtonText,
                    (!newPost.title.trim() || !newPost.content.trim()) && styles.submitButtonTextDisabled
                  ]}>
                    {editingPost ? 'Update Post' : 'Post Question'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCommentsModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedPost && (
                <>
                  <View style={styles.selectedPost}>
                    <Text style={styles.selectedPostTitle}>{selectedPost.title}</Text>
                    <Text style={styles.selectedPostContent}>{selectedPost.content}</Text>
                    <Text style={styles.selectedPostAuthor}>by {selectedPost.author}</Text>
                  </View>

                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>
                      {selectedPost.replies || 0} {selectedPost.replies === 1 ? 'Comment' : 'Comments'}
                    </Text>

                    {selectedPost.comments && selectedPost.comments.length > 0 ? (
                      selectedPost.comments.map((comment) => (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentHeaderLeft}>
                              <Text style={styles.commentAuthor}>{comment.author}</Text>
                              <Text style={styles.commentTimestamp}>
                                {formatTimestamp(comment.timestamp)}
                              </Text>
                              {comment.editedAt && (
                                <Text style={styles.editedText}> (edited)</Text>
                              )}
                            </View>
                            {isMyComment(comment) && (
                              <View style={styles.commentActions}>
                                <TouchableOpacity 
                                  style={styles.actionButton}
                                  onPress={() => handleEditComment(comment)}
                                >
                                  <Ionicons name="create-outline" size={14} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={styles.actionButton}
                                  onPress={() => handleDeleteComment(comment)}
                                >
                                  <Ionicons name="trash-outline" size={14} color="#e91e63" />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                          
                          {editingComment && editingComment.id === comment.id ? (
                            <View style={styles.editCommentSection}>
                              <TextInput
                                style={styles.editCommentInput}
                                value={editedCommentText}
                                onChangeText={setEditedCommentText}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                maxLength={300}
                                autoFocus
                              />
                              <View style={styles.editCommentActions}>
                                <TouchableOpacity
                                  style={styles.cancelEditButton}
                                  onPress={() => {
                                    setEditingComment(null);
                                    setEditedCommentText('');
                                  }}
                                >
                                  <Text style={styles.cancelEditText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.saveEditButton,
                                    !editedCommentText.trim() && styles.saveEditButtonDisabled
                                  ]}
                                  onPress={handleUpdateComment}
                                  disabled={!editedCommentText.trim()}
                                >
                                  <Text style={[
                                    styles.saveEditText,
                                    !editedCommentText.trim() && styles.saveEditTextDisabled
                                  ]}>
                                    Save
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.commentContent}>{comment.content}</Text>
                          )}
                          
                          {/* Action Buttons Below Comment */}
                          <View style={styles.commentActions}>
                            <TouchableOpacity 
                              style={styles.actionButton}
                              onPress={() => handleReplyToComment(comment)}
                            >
                              <Ionicons name="return-up-back-outline" size={14} color="#666" />
                              <Text style={styles.actionButtonText}>Reply</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.actionButton}
                              onPress={() => handleLikeComment(comment.id, true)}
                            >
                              <Ionicons 
                                name={likedComments.has(comment.id) ? "thumbs-up" : "thumbs-up-outline"} 
                                size={14} 
                                color={likedComments.has(comment.id) ? "#00008b" : "#666"} 
                              />
                              <Text style={[
                                styles.actionButtonText, 
                                likedComments.has(comment.id) && styles.likedText
                              ]}>
                                {comment.likes || 0}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.actionButton}
                              onPress={() => handleLikeComment(comment.id, false)}
                            >
                              <Ionicons 
                                name={dislikedComments.has(comment.id) ? "thumbs-down" : "thumbs-down-outline"} 
                                size={14} 
                                color={dislikedComments.has(comment.id) ? "#e91e63" : "#666"} 
                              />
                              <Text style={[
                                styles.actionButtonText, 
                                dislikedComments.has(comment.id) && styles.dislikedText
                              ]}>
                                {comment.dislikes || 0}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          
                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <View style={styles.repliesSection}>
                              {comment.replies.map((reply) => (
                                <View key={reply.id} style={styles.replyItem}>
                                  <View style={styles.replyHeader}>
                                    <View style={styles.replyHeaderLeft}>
                                      <Text style={styles.replyAuthor}>{reply.author}</Text>
                                      <Text style={styles.replyTimestamp}>
                                        {formatTimestamp(reply.timestamp)}
                                      </Text>
                                      {reply.editedAt && (
                                        <Text style={styles.editedText}> (edited)</Text>
                                      )}
                                    </View>
                                    {isMyReply(reply) && (
                                      <View style={styles.replyActions}>
                                        <TouchableOpacity 
                                          style={styles.actionButton}
                                          onPress={() => handleEditReply(comment, reply)}
                                        >
                                          <Ionicons name="create-outline" size={12} color="#666" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                          style={styles.actionButton}
                                          onPress={() => handleDeleteReply(comment, reply)}
                                        >
                                          <Ionicons name="trash-outline" size={12} color="#e91e63" />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                  
                                  {editingReply && editingReply.reply.id === reply.id ? (
                                    <View style={styles.editReplySection}>
                                      <TextInput
                                        style={styles.editReplyInput}
                                        value={editedReplyText}
                                        onChangeText={setEditedReplyText}
                                        multiline
                                        numberOfLines={2}
                                        textAlignVertical="top"
                                        maxLength={200}
                                        autoFocus
                                      />
                                      <View style={styles.editReplyActions}>
                                        <TouchableOpacity
                                          style={styles.cancelEditButton}
                                          onPress={() => {
                                            setEditingReply(null);
                                            setEditedReplyText('');
                                          }}
                                        >
                                          <Text style={styles.cancelEditText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={[
                                            styles.saveEditButton,
                                            !editedReplyText.trim() && styles.saveEditButtonDisabled
                                          ]}
                                          onPress={handleUpdateReply}
                                          disabled={!editedReplyText.trim()}
                                        >
                                          <Text style={[
                                            styles.saveEditText,
                                            !editedReplyText.trim() && styles.saveEditTextDisabled
                                          ]}>
                                            Save
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ) : (
                                    <Text style={styles.replyContent}>{reply.content}</Text>
                                  )}
                                  
                                  {/* Reply Actions */}
                                  <View style={styles.replyActions}>
                                    <TouchableOpacity 
                                      style={styles.actionButton}
                                      onPress={() => handleLikeReply(comment.id, reply.id, true)}
                                    >
                                      <Ionicons 
                                        name={likedReplies.has(reply.id) ? "thumbs-up" : "thumbs-up-outline"} 
                                        size={12} 
                                        color={likedReplies.has(reply.id) ? "#00008b" : "#666"} 
                                      />
                                      <Text style={[
                                        styles.actionButtonText, 
                                        likedReplies.has(reply.id) && styles.likedText
                                      ]}>
                                        {reply.likes || 0}
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      style={styles.actionButton}
                                      onPress={() => handleLikeReply(comment.id, reply.id, false)}
                                    >
                                      <Ionicons 
                                        name={dislikedReplies.has(reply.id) ? "thumbs-down" : "thumbs-down-outline"} 
                                        size={12} 
                                        color={dislikedReplies.has(reply.id) ? "#e91e63" : "#666"} 
                                      />
                                      <Text style={[
                                        styles.actionButtonText, 
                                        dislikedReplies.has(reply.id) && styles.dislikedText
                                      ]}>
                                        {reply.dislikes || 0}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                          
                          {/* Reply Input */}
                          {replyingToComment && replyingToComment.id === comment.id && (
                            <View style={styles.replyInputSection}>
                              <Text style={styles.replyingToText}>
                                Replying to {comment.author}
                              </Text>
                              <TextInput
                                style={styles.replyInput}
                                placeholder="Write a reply..."
                                value={newReply}
                                onChangeText={setNewReply}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                maxLength={200}
                              />
                              <View style={styles.replyActions}>
                                <TouchableOpacity
                                  style={styles.cancelReplyButton}
                                  onPress={() => setReplyingToComment(null)}
                                >
                                  <Text style={styles.cancelReplyText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.postReplyButton,
                                    !newReply.trim() && styles.postReplyButtonDisabled
                                  ]}
                                  onPress={handleAddReply}
                                  disabled={!newReply.trim()}
                                >
                                  <Text style={[
                                    styles.postReplyText,
                                    !newReply.trim() && styles.postReplyTextDisabled
                                  ]}>
                                    Reply
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                    )}
                  </View>

                  <View style={styles.addCommentSection}>
                    <Text style={styles.addCommentTitle}>Add a Comment</Text>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      maxLength={300}
                    />
                    <TouchableOpacity 
                      style={styles.addCommentButton}
                      onPress={handleAddComment}
                    >
                      <Text style={styles.addCommentButtonText}>Post Comment</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00008b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00008b',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  postCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryCard: {
    backgroundColor: '#00008b',
    borderColor: '#00008b',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  selectedCategoryName: {
    color: 'white',
  },
  postsSection: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  postCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postCategory: {
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 12,
    color: '#666',
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  likedText: {
    color: '#00008b',
  },
  dislikedText: {
    color: '#e91e63',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  categoryOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  selectedCategoryOption: {
    backgroundColor: '#00008b',
    borderColor: '#00008b',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryOptionText: {
    color: 'white',
  },
  titleInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#00008b',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  submitButtonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#00008b',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Post Actions
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postActions: {
    flexDirection: 'row',
    gap: 4,
  },
  postFooterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  likedText: {
    color: '#e91e63',
  },
  // Comments Modal Styles
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectedPost: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  selectedPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  selectedPostContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  selectedPostAuthor: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentHeaderLeft: {
    flex: 1,
  },
  editedText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  editCommentSection: {
    marginBottom: 8,
  },
  editCommentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  cancelEditText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  saveEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#00008b',
  },
  saveEditButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveEditText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  saveEditTextDisabled: {
    color: '#999',
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  replyButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  likeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  repliesSection: {
    marginTop: 12,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  replyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyHeaderLeft: {
    flex: 1,
  },
  editReplySection: {
    marginBottom: 4,
  },
  editReplyInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  editReplyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  replyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00008b',
  },
  replyTimestamp: {
    fontSize: 11,
    color: '#666',
  },
  replyContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 16,
  },
  replyInputSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  replyInput: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    minHeight: 60,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  cancelReplyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  postReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#00008b',
  },
  postReplyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postReplyText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  postReplyTextDisabled: {
    color: '#999',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00008b',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  addCommentSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  addCommentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    minHeight: 80,
  },
  addCommentButton: {
    backgroundColor: '#00008b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCommentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
