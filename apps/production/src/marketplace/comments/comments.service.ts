import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm'
import * as _isEmpty from 'lodash/isEmpty'
import { Comment } from './entities/comment.entity'
import { CreateReplyCommentBodyDto } from './dtos/bodies/create-reply.dto'
import { UpdateCommentReplyBodyDto } from './dtos/bodies/update-reply.dto'
import { CommentReply } from './entities/comment-reply.entity'

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(CommentReply)
    private commentReplyRepository: Repository<CommentReply>,
  ) {}

  async findAndCount(
    options: FindManyOptions<Comment>,
  ): Promise<[Comment[], number]> {
    return this.commentsRepository.findAndCount({ ...options })
  }

  async getCommentsByExtId(extensionId: string, skip: number, take: number) {
    return this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.extensionId = :extensionId', { extensionId })
      .leftJoinAndSelect('comment.replies', 'reply')
      .leftJoinAndSelect('reply.user', 'replyUser')
      .leftJoinAndSelect('comment.user', 'commentUser')
      .select([
        'comment.id',
        'comment.text',
        'comment.addedAt',
        'comment.extensionId',
        'comment.rating',
        // 'commentUser.id',
        'commentUser.nickname',
        'reply.id',
        'reply.text',
        'reply.addedAt',
        'replyUser.nickname',
      ])
      .skip(skip)
      .take(take)
      .getManyAndCount()
  }

  async findOne(options: FindOneOptions<Comment>): Promise<Comment> {
    return this.commentsRepository.findOne({ ...options })
  }

  async save(comment: Partial<Comment>): Promise<Comment> {
    return this.commentsRepository.save(comment)
  }

  async delete(id: string): Promise<void> {
    await this.commentsRepository.delete(id)
  }

  async update(id: string, comment: Partial<Comment>): Promise<Comment> {
    await this.commentsRepository.update(id, comment)
    return this.commentsRepository.findOne(id)
  }

  async createCommentReply(
    commentReplyDto: CreateReplyCommentBodyDto,
    comment: Comment,
    userId: string,
  ): Promise<CommentReply> {
    const commentReply = this.commentReplyRepository.create({
      text: commentReplyDto.text,
      parentComment: comment,
      userId,
    })
    return this.commentReplyRepository.save(commentReply)
  }

  async haveUserRepliedToComment(
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    return !_isEmpty(
      await this.commentReplyRepository
        .createQueryBuilder('reply')
        .where('reply.parentCommentId = :id', { id: commentId })
        .andWhere('reply.userId = :userId', { userId })
        // .leftJoinAndSelect('reply.parentComment', 'parentComment')
        // .leftJoinAndSelect('reply.user', 'user')
        .select(['reply.id'])
        .getOne(),
    )
  }

  async findCommentReplyById(id: string) {
    return this.commentReplyRepository
      .createQueryBuilder('reply')
      .where('reply.id = :id', { id })
      .leftJoinAndSelect('reply.user', 'user')
      .select([
        'reply.id',
        'reply.text',
        'reply.addedAt',
        'user.nickname',
        'user.id',
      ])
      .getOne()
  }

  async updateCommentReply(
    id: string,
    commentReplyDto: UpdateCommentReplyBodyDto,
  ): Promise<CommentReply | undefined> {
    await this.commentReplyRepository.update(id, commentReplyDto)

    return this.findCommentReplyById(id)
  }

  async deleteCommentReply(id: string): Promise<void> {
    await this.commentReplyRepository.delete(id)
  }
}
