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
    mode        int         default 0                   not null comment '0:일반사용자, 1:패널가입, 2:관리자, 3:개발자',
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
	surveyCode  varchar(255)                            not null comment '서베이 생성 고유넘버',
	surveyType  varchar(255)                            not null comment '서베이 타입 0: 일반 설문, 1: 변환 설문, ',
    survey      JSON                                    not null comment '설문 데이터',
	status      int         default 0                   not null comment '0:생성, 1:배포됨, 2:중단, 3:완료, 4:삭제',
    sendType    int         default 0                   not null comment '0:MMS, 1:카카오, 2:메일, 3:URL',
    sendContact JSON                                    not null comment '응답자 발송 정보',
    sendURL     varchar(255)                            not null comment '설문 배포 고유 URL',
    thumbnail   varchar(255)                                null comment '설문 썸내일',
	fileCode    varchar(255)                                null comment '파일 업로드 고유넘버 -> 설문타입 1 = 변환 설문 시 필수',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, surveyCode),
    constraint fk_survey_online_layout_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE SurveyAnswers;
CREATE OR REPLACE TABLE SurveyAnswers
(
    identifyCode    binary(16)       default UUID()                              null comment '응답자 고유식별자',
	fileCode    varchar(255)                             not null comment '파일 업로드 고유넘버',
    answer      JSON                                    not null comment '변경된 설문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (IdentifyCode, fileCode)
) charset = utf8mb3;

ALTER TABLE SurveyAnswers DROP phoneCode;
ALTER TABLE SurveyAnswers ADD phoneCode varchar(255) not null default '' comment '응답자 휴대전화번호 식별자' after identifyCode;
ALTER TABLE SurveyAnswers MODIFY COLUMN phoneCode varchar(255) after identifyCode;

INSERT INTO SurveyOnlineAnswers (identifyCode, surveyCode, answer) VALUES (UNHEX(REPLACE(UUID(),'-','')), '1f0f6c8cd554da70c596680cf1ee044c', '[]');

DELIMITER $$
CREATE PROCEDURE SurveyOnlineAnswersInsert() -- ⓐ myFunction이라는 이름의 프로시져
BEGIN
    DECLARE i INT DEFAULT 1; -- ⓑ i변수 선언, defalt값으로 1설정
    WHILE (i <= 60) DO -- ⓒ for문 작성(i가 1000이 될 때까지 반복)
        INSERT INTO SurveyOnlineAnswers (identifyCode, surveyCode, answer) VALUES (UNHEX(REPLACE(UUID(),'-','')), '1f0f6c8cd554da70c596680cf1ee044c', '[]');
        SET i = i + 1; -- ⓔ i값에 1더해주고 WHILE문 처음으로 이동
    END WHILE;
END$$
DELIMITER ;
CALL SurveyOnlineAnswersInsert();

DROP TABLE SurveyAnswersEachUrl;
CREATE OR REPLACE TABLE SurveyAnswersEachUrl
(
    identifyCode    varchar(255)                                    null comment '응답자 고유식별자',
    phoneCode    varchar(255)                                  null comment '응답자 휴대전화번호 식별자',
	surveyCode    varchar(255)                             not null comment '파일 업로드 고유넘버',
    answer      JSON                                    not null comment '변경된 설문 데이터',
	status      int         default 0                   not null comment '0:응답전, 1:응답중, 2:응답완료, 4:만료',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (identifyCode, surveyCode)
) charset = utf8mb3;

ALTER TABLE SurveyAnswersEachUrl MODIFY COLUMN status int default 0 not null comment '0:응답전, 1:응답중, 2:응답완료, 4:만료';


DROP TABLE SurveyOnlineAnswers;
CREATE OR REPLACE TABLE SurveyOnlineAnswers
(
    identifyCode    binary(16)                               null comment '응답자 고유식별자',
    phoneCode   varchar(255) not null default '' comment '응답자 휴대전화번호 식별자',
	surveyCode    varchar(255)                             not null comment '파일 업로드 고유넘버',
	status      int          not null default 0  comment '0:응답전, 1:응답중, 2:응답완료, 4:만료',
    answer      JSON                                    not null comment '변경된 설문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (IdentifyCode, surveyCode)
) charset = utf8mb3;

SELECT * FROM SurveyOnlineAnswers WHERE surveyCode = '1f0f6c8cd554da70c596680cf1ee044c';

ALTER TABLE SurveyOnlineAnswers ADD phoneCode varchar(255) not null default '' comment '응답자 휴대전화번호 식별자' after identifyCode;
ALTER TABLE SurveyOnlineAnswers ADD status    int          not null default 0  comment '0:응답전, 1:응답중, 2:응답완료' after surveyCode;
ALTER TABLE SurveyOnlineAnswers MODIFY COLUMN status int default 0 not null comment '0:응답전, 1:응답중, 2:응답완료, 4:만료';



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
    status                  varchar(255)                 not null comment '0:시도(회색), 1:승인(파랑), 2:실패(빨강), 3:취소(노랑)',
    billingUid              varchar(255)                     null comment '결제 식별번호:DAOUTRX',
    registerCode            varchar(255)                     null comment '카드 고유 식별번호',
    orderType               varchar(255)                 not null comment '주문 타입 => 0:plan, 1: panel, 2: reward',
    orderCode               varchar(255)                 not null comment '주문 고유 식별번호=merchant_uid',
    orderName               varchar(255)                 not null comment '주문 이름=name',
    amount                  varchar(255)                 not null comment '주문 금액',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (UserCode, orderCode),
    constraint fk_payment_request_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
) charset = utf8mb3;

ALTER TABLE UsersPaymentRequest DROP orderCount;
ALTER TABLE UsersPaymentRequest ADD orderCount int not null default 0 comment '주문 개수' after amount;
ALTER TABLE UsersPaymentRequest ADD issuedCount int not null default 0 comment '발행 개수' after orderCount;


DROP TABLE UsersGiftSendLog;
CREATE OR REPLACE TABLE UsersGiftSendLog
(
    UserCode                binary(16)                       null comment '사용자 고유식별자',
	surveyCode              varchar(255)                 not null comment '서베이 생성 고유넘버',
    orderCode               varchar(255)                 not null comment '주문 고유 식별번호=merchant_uid',
    status                  varchar(255)                 not null comment '0:대기, 1:승인(파랑), 2:취소(노랑), 3:완료(초록)',
    identifyCode            binary(16)                       null comment '응답자 고유식별자',
    phoneCode               varchar(255)                 not null default '' comment '응답자 휴대전화번호 식별자',
    createdAt   timestamp   default current_timestamp()  not null comment '생성일',
    updatedAt   timestamp                                    null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                    null comment '삭제일',
    PRIMARY KEY (UserCode,surveyCode, identifyCode),
    constraint fk_payment_gift_users_code foreign key (UserCode) references Users (code) on update cascade on delete cascade
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




DROP TABLE Panels;
CREATE OR REPLACE TABLE Panels
(
    id          int         auto_increment primary key,
    code        binary(16)                              not null comment '사용자 고유식별자',
    name        varchar(50)                             not null comment '이름',
	phone       varchar(50)                             not null comment '휴대전화',
    email       varchar(50)                             not null comment '이메일=아이디',
    password    varchar(100)                            not null comment '비밀번호',
    nickname    varchar(50)                             not null comment '닉네임',
    mode        int         default 0                   not null comment '0:일반 사용자, 1:패널가입, 2:관리자, 3:개발자',
	status      int         default 0                   not null comment '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
	type        int         default 0                   not null comment '0:Free, 1:Basic, 2:Pro, 3:Develop',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    constraint email unique (email),
    constraint code unique (code)
) charset = utf8mb3;


DROP TABLE PanelsDetail;
CREATE OR REPLACE TABLE PanelsDetail
(
    id          int         auto_increment primary key,
    PanelCode    binary(16)                                  null comment '사용자 고유식별자',
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
    constraint PanelCode unique (PanelCode),
    constraint fk_detail_panels_code foreign key (PanelCode) references Panels (code) on update cascade on delete cascade
) charset = utf8mb3;


DROP TABLE PanelsSyncSNS;
CREATE OR REPLACE TABLE PanelsSyncSNS
(
    PanelCode    binary(16)                                  null comment '사용자 고유식별자',
	auth        int         default 0                   not null comment '0:일반, 1:애플, 2:구글, 3:카카오, 4:네이버',
    identify    varchar(255)                                null comment '소셜 인증 고유 식별자',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (PanelCode, auth),
    constraint fk_sync_panels_code foreign key (PanelCode) references Panels (code) on update cascade on delete cascade
) charset = utf8mb3;

DROP TABLE PanelsQuestionList;
CREATE OR REPLACE TABLE PanelsQuestionList
(
    QuestionCode    varchar(255)                        not null comment '사용자 고유식별자',
    title       varchar(255)                            not null comment '질문',
    description varchar(255) default null                   null comment '질문 설명',
    type        int         default 0                   not null comment '0:객관식사각형, 1:객관식리스트, 2:객관식육각형, 3:주관식',
    item        JSON        default '[]'                not null comment '설문 질문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (QuestionCode)
#     constraint fk_sync_panels_code foreign key (QuestionCode) references Panels (code) on update cascade on delete cascade
) charset = utf8mb3;


INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0001', '성별을 선택해주세요.','', 0,
                                                                          '[{ "index": 0, "text": "남성", "count": 0},{ "index": 1, "text": "여성", "count": 1 }]');


# ['기독교', '불교', '원불교', '이슬람교', '천주교', '무교', '그외']
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0002', '종교를 선택해주세요.','', 2,
                                                                          '[{ "index": 0, "text": "기독교", "count": 0},{ "index": 1, "text": "불교", "count": 1 },{ "index": 2, "text": "원불교", "count": 2},{ "index": 3, "text": "이슬람교", "count": 3 },{ "index": 4, "text": "천주교", "count": 4},{ "index": 5, "text": "무교", "count": 5 },{ "index": 6, "text": "그외", "count": 6 }]');

# { text: '월 평균 200만원 이하', count: 0 },
#     { text: '월 평균 400만원 이하', count: 10 },
#     { text: '월 평균 600만원 이하', count: 10 },
#     { text: '월 평균 800만원 이하', count: 10 },
#     { text: '월 평균 800만원 초과', count: 10 },
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0003', '소득을 선택해주세요.','', 2,
                                                                          '[{ "index": 0, "text": "월 평균 200만원 이하", "count": 0},{ "index": 1, "text": "월 평균 400만원 이하", "count": 1 },{ "index": 2, "text": "월 평균 600만원 이하", "count": 2},{ "index": 3, "text": "월 평균 800만원 이하", "count": 3 },{ "index": 4, "text": "월 평균 800만원 초과", "count": 4}]');

# 주거지 계약 형태를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0004', '주거 형태를 선택해주세요.','', 2, '[]');

# 주거지 계약 형태를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0005', '함께 거주하는 인원을 선택해주세요.','', 1, '[]');

# 함께 거주하는 인원을 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0006', '함께 거주하는 인원을 선택해주세요.','', 1, '[]');

# 함께 거주하는 구성원을 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0007', '함께 거주하는 구성원을 선택해주세요.','', 2, '[]');

# 혼인 여부를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0008', '혼인 여부를 선택해주세요.','', 1, '[]');

# 자녀 수를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0009', '자녀 수를 선택해주세요.','', 1, '[]');

# 반려동물 여부를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0010', '반려동물 여부를 선택해주세요.','', 0, '[]');

# 취미를 입력해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0011', '취미를 입력해주세요.','', 3, '[]');

# 취미 활동 시간을 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0012', '취미 활동 시간을 선택해주세요.','', 3, '[]');


## PAGE 3
# 자주 사용하는 교통 수단을 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0013', '자주 사용하는 교통 수단을 선택해주세요.','', 0, '[]');

# 면허 여부를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0014', '면허 여부를 선택해주세요.','', 0, '[]');

# 보유한 차량 종류를 선택해주세요. (중복 선택 가능)
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0015', '보유한 차량 종류를 선택해주세요.(중복 선택 가능)','', 1, '[]');

# 통신사를 선택해주세요.
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0016', '통신사를 선택해주세요.','', 2, '[]');

# 월 통신비를 선택해주세요. (핸드폰비 포함)
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0017', '월 통신비를 선택해주세요. (핸드폰비 포함)','', 1, '[]');

# 월 통신비를 선택해주세요. (핸드폰비 포함)
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0018', '직업군을 선택해주세요.','', 1, '[]');

# 고용 형태를 입력해주세요. (중복 선택 가능)
INSERT INTO PanelsQuestionList (QuestionCode, title, description,type,item) VALUES ('Q-0019', '고용 형태를 입력해주세요. (중복 선택 가능)','', 2, '[]');


DROP TABLE PanelsQuestionAnswer;
CREATE OR REPLACE TABLE PanelsQuestionAnswer
(
    PanelCode    binary(16)                                 null comment '패널 고유식별자',
	QuestionCode varchar(255)                             not null comment '답변에 고유넘버',
    answer      JSON                                    not null comment '변경된 설문 데이터',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp                                   null on update current_timestamp() comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    PRIMARY KEY (PanelCode, QuestionCode),
    constraint fk_answer_panels_code foreign key (PanelCode) references Panels (code) on update cascade on delete cascade,
    constraint fk_answer_question_code foreign key (QuestionCode) references PanelsQuestionList (QuestionCode) on update cascade on delete cascade
) charset = utf8mb3;


# 게시판 - 공지
DROP TABLE BoardNotice;
CREATE OR REPLACE TABLE BoardNotice
(
    id          int                                     auto_increment primary key,
    code        varchar(255)                              not null comment '글 고유식별자',
    title       varchar(255)                             not null comment '이름',
    contents    varchar(255)                             not null comment '내용',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    OwnerCode   binary(16)                                  null comment '사용자 고유식별자',
    constraint code unique (code),
    constraint fk_board_notice_users_code foreign key (OwnerCode) references Users (code) on update cascade on delete set null
) charset = utf8mb3;

# Board Notice Example.

# 게시판 - 미디어
DROP TABLE BoardLearning;
CREATE OR REPLACE TABLE BoardLearning
(
    id          int                                     auto_increment primary key,
    code        varchar(255)                              not null comment '글 고유식별자',
    title       varchar(255)                             not null comment '이름',
    contents    varchar(255)                             not null comment '내용',
    createdAt   timestamp   default current_timestamp() not null comment '생성일',
    updatedAt   timestamp   on update current_timestamp()   null comment '수정일',
    deletedAt   timestamp                                   null comment '삭제일',
    OwnerCode   binary(16)                                  null comment '사용자 고유식별자',
    constraint code unique (code),
    constraint fk_board_learing_users_code foreign key (OwnerCode) references Users (code) on update cascade on delete set null
) charset = utf8mb3;
