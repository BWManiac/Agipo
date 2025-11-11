

@https://webcontainers.io/api 

@https://webcontainers.io/api#webcontainer 

@https://webcontainers.io/api#webcontainer 

@https://webcontainers.io/api#webcontainer 

@https://webcontainers.io/guides/working-with-the-file-system 

Let's think about this from the ground up. I would describe, I'm going to describe how this, I would expect this to work and then you either correct me, you tell me how it works or we think about how to incorporate this into our document. At a high level, what I would expect is to have a singular webcontainer that is going to be created. I think for the time being, you know, we can make sure that there's a robust singleton pattern or whatever you want to call it. The idea is that we have only one webcontainer and this webcontainer is going to be responsible for everything. Now, the idea here at a high level. Is that we probably need to look into the webcontainer a little bit more, you know, and how it works. When I read this, I see, for example, we need to boot and we need to return an instance. I don't know when we need to boot or return an instance. I would assume booting would happen on the actual file thing or whatever. But, you know, I think you need to think about this as like a whole system, right? Which maybe you aren't. Yeah. And then, you know, I see that we have this concept in here called spawn. Perhaps when we run something, that's when we spawn an instance. And then, yeah, you know, that's maybe my guess is like, yeah, running is spawning an instance. I wonder when we should do teardown as well, because when I see teardown, you know, I wonder when we need to do that. But then, yeah, coming back to here on the main thing. I see that we also have the concept of like the file system, you know, and I assume that a lot of this stuff, I think we'll have to think about how they should work with the extend and state as well. But regardless, you know, we have the files and then we need to make sure that we're maintaining this file system within all of these different nodes. Right. And it's tied together. Right. So anyway, these are all the concepts. Let's engage. Let's do this. Let's do it.


all white collar work is effectivley humans as an api. If you want to be reductive, all jobs are basically APIs. There's some level of tool calling for the workflows

scannability as a heuresitci is where most of the existing workflow tools today fail

Predictions about the future of work:

People will sell their competency via AI