USE votg_api_dev;

#MAKE UUID
SELECT UUID();
SELECT REPLACE(UUID(),'-','');
SELECT UNHEX(REPLACE(UUID(),'-',''));
SELECT LENGTH(UNHEX(REPLACE(UUID(),'-','')));
# SELECT SYS_GUID();

#Check All DB Size
SELECT table_schema "Database Name",
SUM(data_length + index_length) / 1024 / 1024 "Size(MB)"
FROM information_schema.TABLES
GROUP BY table_schema;

#Check Tables Size : GB
SELECT
concat(table_schema,'.',table_name),
concat(round(data_length/(1024*1024*1024),2),'G') DATA,
concat(round(index_length/(1024*1024*1024),2),'G') idx,
concat(round((data_length+index_length)/(1024*1024*1024),2),'G') total_size,
round(index_length/data_length,2) idxfrac
FROM information_schema.TABLES
WHERE table_rows is not null;

#Check Tables Size : GB
SELECT
concat(table_schema,'.',table_name),
concat(round(data_length/(1024*1024),2),'M') DATA,
concat(round(index_length/(1024*1024),2),'M') idx,
concat(round((data_length+index_length)/(1024*1024),2),'M') total_size,
round(index_length/data_length,2) idxfrac
FROM information_schema.TABLES
WHERE table_rows is not null;


SHOW FULL COLUMNS FROM votg_api_dev.Users;
SHOW FULL COLUMNS FROM votg_api_dev.Organizations;
ALTER TABLE votg_api_dev.Users CONVERT TO CHARACTER SET utf8mb3 collate null;

#DESC :: TABLE INFO
DESC Users;                     #10
DESC Organizations;             #20

#DROP :: TABLE LIST
DROP TABLE Users;
DROP TABLE UsersDetail;
DROP TABLE UsersSyncSNS;
DROP TABLE Organizations;
DROP TABLE OrganizationsMembers;
DROP TABLE Services;
DROP TABLE ServicesCustomers;


DROP TABLE Users;
CREATE OR REPLACE TABLE Users
(
    id          int         auto_increment primary key,
    code        binary(16)                              not null comment '사용자 고유식별자',
    name        varchar(50)                             not null comment '이름',
	phone       varchar(50)                             not null comment '휴대전화',
    email       varchar(50)                             not null comment '이메일=아이디',
    password    varchar(100)                            not null comment '비밀번호',
    nickname    varchar(50)                             not null comment '닉네임',
    mode        int         default 0                   not null comment '0:커스터머, 1:조직맴버, 2:관리자, 3:개발자',
	status      int         default 0                   not null comment '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
	type        int         default 0                   not null comment '0:Free, 1:Basic, 2:Pro, 3:Develop',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    constraint email unique (email),
    constraint code unique (code)
) charset = utf8mb3;


DROP TABLE UsersDetail;
CREATE OR REPLACE TABLE UsersDetail
(
    id          int         auto_increment primary key,
    UserCode    binary(16)                                  null comment '사용자 고유식별자',
    profile     varchar(255)                                null comment '프로필 사진',
    arg_phone   tinyint(1)  default 0                   not null comment '수단별 수신동의 - 모바일',
    arg_email   tinyint(1)  default 0                   not null comment '수단별 수신동의 - 메일',
    birthday    date                                        null comment '생년월일 yyyy-mm-dd',
    age_range   int                                         null comment '생년월일 yyyy-mm-dd',
    gender      int                                         null comment '0: 생략, 1: 남성, 2: 여성,',
    address_road int                                        null comment '도로면 주소 전체',
    address_detail int                                      null comment '상세 주소',
    address_zip int                                         null comment '우편번호',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    constraint UserCode unique (UserCode),
    constraint fk_detail_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE UsersSyncSNS;
CREATE OR REPLACE TABLE UsersSyncSNS
(
    UserCode    binary(16)                                  null comment '사용자 고유식별자',
	auth        int         default 0                   not null comment '0:일반, 1:애플, 2:구글, 3:카카오, 4:네이버',
    identify    varchar(255)                                null comment '소셜 인증 고유 식별자',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, auth),
    constraint fk_sync_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE UsersUploadLogs;
CREATE OR REPLACE TABLE UsersUploadLogs
(
    UserCode    binary(16)                                  null comment '사용자 고유식별자',
	fileCode    varchar(255)                            not null comment '파일 업로드 고유넘버',
    fileName    varchar(255)                                null comment '파일 이름',
    filePath    varchar(255)                                null comment '저장 경로',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, fileCode),
    constraint fk_upload_logs_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE UsersSurveyDocuments;
CREATE OR REPLACE TABLE UsersSurveyDocuments
(
    UserCode    binary(16)                                  null comment '사용자 고유식별자',
	fileCode    varchar(255)                            not null comment '파일 업로드 고유넘버',
    survey      JSON                                    not null comment '변경된 설문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, fileCode),
    constraint fk_survey_document_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;

DROP TABLE UsersSurveyCustomLayouts;
CREATE OR REPLACE TABLE UsersSurveyCustomLayouts
(
    UserCode    binary(16)                                  null comment '사용자 고유식별자',
	surveyCode    varchar(255)                            not null comment '서베이 생성 고유넘버',
	fileCode    varchar(255)                            not null comment '파일 업로드 고유넘버',
	status      int         default 0                   not null comment '0:생성, 1:배포됨, 2:중단, 3:완료, 4:삭제',
    survey      JSON                                    not null comment '변경된 설문 데이터',
    sendType    int         default 0                   not null comment '0:MMS, 1:카카오, 2:메일, 3:URL',
    sendContact JSON                                    not null comment '응답자 발송 정보',
    sendURL     varchar(255)                            not null comment '파일 배포 고유 URL',
    thumbnail   varchar(255)                                null comment '파일 썸내일',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, fileCode),
    constraint fk_survey_custom_layout_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;

DROP TABLE UsersSurveyOnlineLayouts;
CREATE OR REPLACE TABLE UsersSurveyOnlineLayouts
(
    UserCode    binary(16)                                  null comment '사용자 고유식별자',
	surveyCode    varchar(255)                            not null comment '서베이 생성 고유넘버',
	status      int         default 0                   not null comment '0:생성, 1:배포됨, 2:중단, 3:완료, 4:삭제',
    survey      JSON                                    not null comment '설문 데이터',
    sendType    int         default 0                   not null comment '0:MMS, 1:카카오, 2:메일, 3:URL',
    sendContact JSON                                    not null comment '응답자 발송 정보',
    sendURL     varchar(255)                            not null comment '파일 배포 고유 URL',
    thumbnail   varchar(255)                                null comment '파일 썸내일',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, surveyCode),
    constraint fk_survey_online_layout_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE SurveyAnswers;
CREATE OR REPLACE TABLE SurveyAnswers
(
    identifyCode    binary(16)                                  null comment '응답자 고유식별자',
	fileCode    varchar(255)                             not null comment '파일 업로드 고유넘버',
    answer      JSON                                    not null comment '변경된 설문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (IdentifyCode, fileCode)
) charset = utf8mb3;


DROP TABLE SurveyOnlineAnswers;
CREATE OR REPLACE TABLE SurveyOnlineAnswers
(
    identifyCode    binary(16)                                  null comment '응답자 고유식별자',
	surveyCode    varchar(255)                             not null comment '파일 업로드 고유넘버',
    answer      JSON                                    not null comment '변경된 설문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (IdentifyCode, surveyCode)
) charset = utf8mb3;


DROP TABLE UsersPaymentCard;
CREATE OR REPLACE TABLE UsersPaymentCard
(
    UserCode                binary(16)                      null comment '사용자 고유식별자',
    registerCode            varchar(255)                    null comment '카드 고유 식별번호',
    cardNickName            varchar(255)                not null comment '카드 별명',
    cardCode                varchar(255)                not null comment '카드 코드',
    cardName                varchar(255)                not null comment '카드 이름',
    cardNumber              varchar(255)                not null comment '카드 번호',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, registerCode),
    constraint fk_payment_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE UsersPaymentPasswd;
CREATE OR REPLACE TABLE UsersPaymentPasswd
(
    UserCode                binary(16)                      null comment '사용자 고유식별자',
    billingPasswd                varchar(100)                not null comment '비밀번호',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode),
    constraint fk_payment_passwd_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


# 13cf0bcf-cb73-47d8-8002-47cae6982b99
SELECT * FROM Users WHERE code = (SELECT UserCode FROM UsersPaymentCard WHERE registerCode = '13cf0bcfcb7347d8800247cae6982b99-1024');

DROP TABLE UsersPaymentRequest;
CREATE OR REPLACE TABLE UsersPaymentRequest
(
    UserCode                binary(16)                       null comment '사용자 고유식별자',
    issuedAt                varchar(255)                 not null comment '처리 시기',
    status                  varchar(255)                 not null comment '0:취소(회색), 1:승인(파랑), 2:실패(빨강), 3:오류(노랑)',
    impUid                  varchar(255)                     null comment '아임포트 식별번호',
    registerCode            varchar(255)                     null comment '카드 고유 식별번호',
    orderType               varchar(255)                 not null comment '주문 타입 => 0:plan, 1: panel, 2: reward',
    orderCode               varchar(255)                 not null comment '주문 고유 식별번호=merchant_uid',
    orderName               varchar(255)                 not null comment '주문 이름=name',
    amount                  varchar(255)                 not null comment '주문 금액',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, registerCode),
    constraint fk_payment_request_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE Organizations;
CREATE OR REPLACE TABLE Organizations
(
    id          int         auto_increment primary key,
    code        binary(16)                              not null comment '조직 고유식별자',
    name        varchar(30)                             not null comment '이름',
    url         varchar(30)                             not null comment '접속주소',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    OwnerCode   binary(16)                                  null comment '사용자 고유식별자',
    constraint name unique (name),
    constraint url unique (url),
    constraint code unique (code),
    constraint OwnerCode unique (OwnerCode),
    constraint fk_organizations_users_code foreign key (OwnerCode) references Users (code) on update cascade on delete set null
) charset = utf8mb3;


DROP TABLE OrganizationsMembers;
CREATE OR REPLACE TABLE OrganizationsMembers
(
    OrgCode     binary(16)                              not null comment '조직 고유식별자',
    UserCode    binary(16)                              not null comment '사용자 고유식별자',
    mode        int         default 0                   not null comment '0:사용자, 1:편집자, 2:관리자, 3:소유자',
	status      int         default 0                   not null comment '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
    loggedInAt  timestamp                                   null comment '로그인 기록',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (OrgCode, UserCode),
    constraint fk_members_organizations_code
        foreign key (OrgCode) references Organizations (code)
            on update cascade on delete cascade,
    constraint fk_members_users_code
        foreign key (UserCode) references Users (code)
            on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE Services;
CREATE OR REPLACE TABLE Services
(
    id          int         auto_increment primary key,
    code        binary(16)                              not null comment '서비스 고유식별자',
    name        varchar(30)                             not null comment '이름',
    url         varchar(30)                             not null comment '접속주소',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    OwnerCode   binary(16)                                  null comment '사용자 고유식별자',
    constraint name unique (name),
    constraint url unique (url),
    constraint code unique (code),
    constraint OwnerCode unique (OwnerCode),
    constraint fk_services_users_code foreign key (OwnerCode) references Users (code) on update cascade on delete set null
) charset = utf8mb3;


DROP TABLE ServicesCustomers;
CREATE OR REPLACE TABLE ServicesCustomers
(
    ServiceCode binary(16)                              not null comment '서비스 고유식별자',
    UserCode    binary(16)                              not null comment '사용자 고유식별자',
    mode        int         default 0                   not null comment '0:사용자, 1:편집자, 2:관리자, 3:소유자',
	status      int         default 0                   not null comment '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
    loggedInAt  timestamp                                   null comment '로그인 기록',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (ServiceCode, UserCode),
    constraint fk_customers_services_code
        foreign key (ServiceCode) references Services (code)
            on update cascade on delete cascade,
    constraint fk_customers_users_code
        foreign key (UserCode) references Users (code)
            on update cascade on delete cascade
) charset = utf8mb3;






